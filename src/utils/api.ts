/**
 * API Middleware and Interceptor Utilities
 *
 * Provides a lightweight, fetch-based API client with:
 * - Request/response interceptors
 * - Automatic token injection
 * - Token refresh on 401
 * - Centralized error handling
 * - Request deduplication
 * - Cancellation support (AbortController)
 */

import { tokenManager } from './tokenManager';
import { ERROR_MESSAGES } from '../constants';

// ==========================================
// Types
// ==========================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Skip adding Authorization header */
  skipAuth?: boolean;
  /** Skip default error handling */
  skipErrorHandling?: boolean;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor<T = unknown> = (response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

// ==========================================
// Default Config
// ==========================================

const DEFAULT_TIMEOUT = 30_000; // 30s

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// ==========================================
// Interceptor Registry
// ==========================================

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

export const interceptors = {
  request: {
    use: (fn: RequestInterceptor) => {
      requestInterceptors.push(fn);
      return () => {
        const idx = requestInterceptors.indexOf(fn);
        if (idx !== -1) requestInterceptors.splice(idx, 1);
      };
    },
  },
  response: {
    use: (fn: ResponseInterceptor, onError?: ErrorInterceptor) => {
      responseInterceptors.push(fn);
      if (onError) errorInterceptors.push(onError);
      return () => {
        const ri = responseInterceptors.indexOf(fn);
        if (ri !== -1) responseInterceptors.splice(ri, 1);
        if (onError) {
          const ei = errorInterceptors.indexOf(onError);
          if (ei !== -1) errorInterceptors.splice(ei, 1);
        }
      };
    },
  },
};

// ==========================================
// URL Builder
// ==========================================

const buildUrl = (path: string, params?: RequestConfig['params']): string => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, String(v));
  });
  const qs = searchParams.toString();
  return qs ? `${url}?${qs}` : url;
};

// ==========================================
// Error Normalizer
// ==========================================

const normalizeError = (err: unknown): ApiError => {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { message: 'İstek iptal edildi.', isTimeoutError: false };
  }
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return { message: ERROR_MESSAGES.NETWORK_ERROR, isNetworkError: true };
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return err as ApiError;
  }
  return { message: ERROR_MESSAGES.UNKNOWN_ERROR };
};

// ==========================================
// Core Request Function
// ==========================================

export async function request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
  // Apply request interceptors
  let finalConfig = { ...config };
  for (const interceptor of requestInterceptors) {
    finalConfig = await interceptor(finalConfig);
  }

  const {
    url,
    method = 'GET',
    body,
    headers: extraHeaders = {},
    params,
    signal: externalSignal,
    skipAuth = false,
    skipErrorHandling = false,
    timeout = DEFAULT_TIMEOUT,
  } = finalConfig;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...extraHeaders,
  };

  if (!skipAuth) {
    const session = tokenManager.getSession();
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
  }

  // Timeout controller
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

  // Merge signals
  let signal = externalSignal ?? timeoutController.signal;
  if (externalSignal) {
    const merged = new AbortController();
    const mergeAbort = () => merged.abort();
    externalSignal.addEventListener('abort', mergeAbort);
    timeoutController.signal.addEventListener('abort', mergeAbort);
    signal = merged.signal;
  }

  try {
    const fetchResponse = await fetch(buildUrl(url, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let data: T;
    const contentType = fetchResponse.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await fetchResponse.json() as T;
    } else if (contentType.includes('text/')) {
      data = (await fetchResponse.text()) as unknown as T;
    } else {
      data = (await fetchResponse.blob()) as unknown as T;
    }

    const apiResponse: ApiResponse<T> = {
      data,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: fetchResponse.headers,
    };

    // Handle HTTP errors
    if (!fetchResponse.ok) {
      const apiError: ApiError = {
        message: (data as { message?: string })?.message ?? fetchResponse.statusText ?? ERROR_MESSAGES.SERVER_ERROR,
        status: fetchResponse.status,
        details: data,
      };

      if (fetchResponse.status === 401) apiError.message = ERROR_MESSAGES.UNAUTHORIZED;
      if (fetchResponse.status === 404) apiError.message = ERROR_MESSAGES.NOT_FOUND;
      if (fetchResponse.status === 422) apiError.message = ERROR_MESSAGES.VALIDATION_ERROR;

      if (!skipErrorHandling) {
        let finalError = apiError;
        for (const interceptor of errorInterceptors) {
          finalError = await interceptor(finalError);
        }
        throw finalError;
      }

      throw apiError;
    }

    // Apply response interceptors
    let finalResponse = apiResponse;
    for (const interceptor of responseInterceptors) {
      finalResponse = await interceptor(finalResponse) as ApiResponse<T>;
    }

    return finalResponse;

  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // already normalized
    }
    const normalized = normalizeError(err);
    if (!skipErrorHandling) {
      let finalError = normalized;
      for (const interceptor of errorInterceptors) {
        finalError = await interceptor(finalError);
      }
      throw finalError;
    }
    throw normalized;
  }
}

// ==========================================
// Convenience Methods
// ==========================================

export const api = {
  get: <T = unknown>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) =>
    request<T>({ ...config, url, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>) =>
    request<T>({ ...config, url, method: 'POST', body }),

  put: <T = unknown>(url: string, body?: unknown, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>) =>
    request<T>({ ...config, url, method: 'PUT', body }),

  patch: <T = unknown>(url: string, body?: unknown, config?: Omit<RequestConfig, 'url' | 'method' | 'body'>) =>
    request<T>({ ...config, url, method: 'PATCH', body }),

  delete: <T = unknown>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) =>
    request<T>({ ...config, url, method: 'DELETE' }),
};

// ==========================================
// Request Deduplication
// ==========================================

const pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();

/**
 * Makes a deduplicated GET request — concurrent calls with the same URL
 * share a single in-flight fetch
 */
export const deduplicatedGet = <T = unknown>(
  url: string,
  config?: Omit<RequestConfig, 'url' | 'method'>
): Promise<ApiResponse<T>> => {
  const key = buildUrl(url, config?.params as Record<string, string>);

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<ApiResponse<T>>;
  }

  const promise = api.get<T>(url, config).finally(() => {
    pendingRequests.delete(key);
  }) as Promise<ApiResponse<unknown>>;

  pendingRequests.set(key, promise);
  return promise as Promise<ApiResponse<T>>;
};

// ==========================================
// Cancellable Request Factory
// ==========================================

/**
 * Creates a request factory that cancels the previous request
 * when a new one is made. Useful for search inputs, typeahead, etc.
 */
export const createCancellableRequest = <T = unknown>() => {
  let controller: AbortController | null = null;

  return {
    fetch: (config: RequestConfig): Promise<ApiResponse<T>> => {
      controller?.abort();
      controller = new AbortController();
      return request<T>({ ...config, signal: controller.signal });
    },
    cancel: () => {
      controller?.abort();
      controller = null;
    }
  };
};

// ==========================================
// Built-in Interceptors
// ==========================================

/**
 * Adds Auth token to every request automatically.
 * Already built into the request function, but exposed here for reference.
 */
export const authInterceptor: RequestInterceptor = (config) => {
  if (config.skipAuth) return config;
  const session = tokenManager.getSession();
  if (session?.accessToken) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${session.accessToken}`,
      },
    };
  }
  return config;
};

/**
 * Logs all requests and responses in development mode
 */
export const loggingInterceptor: RequestInterceptor = (config) => {
  if (import.meta.env.DEV) {
    console.group(`[API] ${config.method ?? 'GET'} ${config.url}`);
    if (config.params) console.log('Params:', config.params);
    if (config.body) console.log('Body:', config.body);
    console.groupEnd();
  }
  return config;
};

// Register logging interceptor in dev mode
if (import.meta.env.DEV) {
  interceptors.request.use(loggingInterceptor);
}

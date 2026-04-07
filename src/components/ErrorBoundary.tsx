/**
 * Error Boundary components for graceful error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

// ==========================================
// Types
// ==========================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** If true, shows a compact inline error rather than a full-page one */
  compact?: boolean;
  /** Label to show in error for context (e.g., "Dashboard chart") */
  context?: string;
}

// ==========================================
// ErrorBoundary Component
// ==========================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 ErrorBoundary caught an error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback, compact, context } = this.props;

    if (!hasError) return children;

    // Custom fallback override
    if (fallback) return fallback;

    // Compact inline error (for charts, widgets, etc.)
    if (compact) {
      return (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center min-h-[80px]">
          <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            {context ? `${context} yüklenemedi` : 'Bileşen yüklenemedi'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Yenile
          </button>
        </div>
      );
    }

    // Full-page error view
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold font-display">Bir hata oluştu</h1>
            </div>
            <p className="text-red-100 text-sm">
              {context
                ? `"${context}" bileşeni yüklenirken beklenmedik bir hata oluştu.`
                : 'Uygulama beklenmedik bir hatayla karşılaştı.'}
            </p>
          </div>

          {/* Error Message */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm font-mono text-red-700 dark:text-red-400 break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* Stack trace toggle (dev mode) */}
            {import.meta.env.DEV && errorInfo && (
              <div>
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {showDetails ? 'Detayları Gizle' : 'Detayları Göster'} (geliştirici modu)
                </button>
                {showDetails && (
                  <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 overflow-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md shadow-indigo-500/25"
              >
                <RefreshCw className="h-4 w-4" />
                Tekrar Dene
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Sayfayı Yenile
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Home className="h-4 w-4" />
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ==========================================
// HOC: withErrorBoundary
// ==========================================

interface WithErrorBoundaryOptions extends Omit<ErrorBoundaryProps, 'children'> {}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary context={displayName} {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return ComponentWithErrorBoundary;
}

// ==========================================
// ChartErrorBoundary — compact variant for chart widgets
// ==========================================

interface ChartErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

export const ChartErrorBoundary: React.FC<ChartErrorBoundaryProps> = ({ children, title }) => (
  <ErrorBoundary compact context={title}>
    {children}
  </ErrorBoundary>
);

// ==========================================
// PageErrorBoundary — full-page variant for route-level errors
// ==========================================

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children, pageName }) => (
  <ErrorBoundary context={pageName}>
    {children}
  </ErrorBoundary>
);

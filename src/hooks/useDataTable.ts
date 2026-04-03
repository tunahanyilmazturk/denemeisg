import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface UseDataTableProps<T> {
  data: T[];
  initialSort?: { key: keyof T; direction: SortDirection };
  initialPageSize?: number;
}

export interface UseDataTableReturn<T> {
  // Data
  data: T[];
  filteredData: T[];
  paginatedData: T[];
  
  // Sorting
  sortConfig: SortConfig<T>;
  handleSort: (key: keyof T) => void;
  
  // Filtering
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function useDataTable<T extends Record<string, any>>({
  data,
  initialSort,
  initialPageSize = 10,
}: UseDataTableProps<T>): UseDataTableReturn<T> {
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSort?.key ?? null,
    direction: initialSort?.direction ?? null,
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some((value) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        result = result.filter((item) => {
          const itemValue = item[key];
          if (itemValue == null) return false;
          return String(itemValue) === String(value);
        });
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle dates
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = Date.parse(aValue);
        const bDate = Date.parse(bValue);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (key: keyof T) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Reset page when search changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return {
    data: sortedData,
    filteredData,
    paginatedData,
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm: handleSearchChange,
    filters,
    setFilter,
    clearFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  };
}

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    header: string | React.ReactNode | (() => React.ReactNode);
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
    hideOnMobile?: boolean;
  }>;
  sortConfig?: {
    key: keyof T | null;
    direction: 'asc' | 'desc' | null;
  };
  onSort?: (key: keyof T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
  emptyMessage?: string | React.ReactNode;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  sortConfig,
  onSort,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  emptyMessage = 'Kayıt bulunamadı.',
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  const getSortIcon = (columnKey: keyof T | string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <div className="w-4 h-4 opacity-0 group-hover:opacity-30"><ChevronUp className="w-3 h-3" /></div>;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      : <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
  };

  // Filter visible columns based on screen size
  const visibleColumns = columns.filter(col => !col.hideOnMobile);

  return (
    <div className="space-y-4">
      <div className="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-2xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 sm:px-6 py-3 font-semibold whitespace-nowrap ${column.hideOnMobile ? 'hidden lg:table-cell' : ''} ${column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors' : ''}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && onSort && onSort(column.key as keyof T)}
                  >
                    <div className={`flex items-center gap-1 group ${column.sortable ? 'select-none' : ''}`}>
                      {typeof column.header === 'function' ? column.header() : column.header}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 sm:px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={keyExtractor(item)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td 
                        key={`${keyExtractor(item)}-${String(column.key)}`} 
                        className={`px-4 sm:px-6 py-3 sm:py-4 ${column.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                      >
                        {column.render 
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? '-')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-white">{startIndex + 1}-{endIndex}</span>
            {' / '}{totalItems} kayıt
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page size selector */}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-9 px-2 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

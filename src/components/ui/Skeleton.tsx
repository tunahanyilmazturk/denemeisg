/**
 * Skeleton Loading Components
 *
 * Provides shimmer/pulse skeleton placeholders for loading states.
 * Used as content-aware placeholders while data loads.
 */

import React from 'react';

// ==========================================
// Base Skeleton Pulse
// ==========================================

interface SkeletonProps {
  className?: string;
  /** Rounded style: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Width class e.g. 'w-full', 'w-1/2', 'w-24' */
  width?: string;
  /** Height class e.g. 'h-4', 'h-6', 'h-10' */
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  rounded = 'md',
  width = 'w-full',
  height = 'h-4',
}) => {
  const roundedMap = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${roundedMap[rounded]} ${width} ${height} ${className}`}
    />
  );
};

// ==========================================
// Stat Card Skeleton
// ==========================================

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton rounded="xl" width="w-12" height="h-12" />
      <Skeleton rounded="md" width="w-8" height="h-5" />
    </div>
    <Skeleton rounded="md" width="w-16" height="h-7" />
    <Skeleton rounded="md" width="w-28" height="h-4" />
  </div>
);

// ==========================================
// Table Row Skeleton
// ==========================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} rounded="md" width="w-3/4" height="h-4" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        className="px-6 py-4 border-b last:border-0 border-slate-100 dark:border-slate-800 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Skeleton
            key={colIdx}
            rounded="md"
            width={colIdx === 0 ? 'w-5/6' : colIdx === columns - 1 ? 'w-2/3' : 'w-full'}
            height="h-4"
          />
        ))}
      </div>
    ))}
  </div>
);

// ==========================================
// Card Grid Skeleton
// ==========================================

interface CardGridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columns = 3,
  className = '',
}) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

// ==========================================
// Individual Card Skeleton
// ==========================================

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}>
    <div className="flex items-start justify-between">
      <Skeleton rounded="full" width="w-10" height="h-10" />
      <Skeleton rounded="full" width="w-16" height="h-6" />
    </div>
    <div className="space-y-2">
      <Skeleton rounded="md" width="w-3/4" height="h-5" />
      <Skeleton rounded="md" width="w-full" height="h-3.5" />
      <Skeleton rounded="md" width="w-5/6" height="h-3.5" />
    </div>
    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
      <Skeleton rounded="md" width="w-20" height="h-4" />
      <Skeleton rounded="md" width="w-16" height="h-4" />
    </div>
  </div>
);

// ==========================================
// Page Header Skeleton
// ==========================================

export const PageHeaderSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
    <div className="space-y-2">
      <Skeleton rounded="lg" width="w-64" height="h-9" />
      <Skeleton rounded="md" width="w-48" height="h-5" />
    </div>
    <div className="flex gap-2">
      <Skeleton rounded="xl" width="w-24" height="h-10" />
      <Skeleton rounded="xl" width="w-24" height="h-10" />
      <Skeleton rounded="xl" width="w-32" height="h-10" />
    </div>
  </div>
);

// ==========================================
// Detail Page Skeleton
// ==========================================

export const DetailPageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton rounded="2xl" width="w-16" height="h-16" />
        <div className="flex-1 space-y-2">
          <Skeleton rounded="lg" width="w-1/2" height="h-7" />
          <div className="flex gap-2">
            <Skeleton rounded="full" width="w-20" height="h-6" />
            <Skeleton rounded="full" width="w-24" height="h-6" />
          </div>
        </div>
      </div>
      <Skeleton rounded="lg" width="w-full" height="h-20" />
    </div>

    {/* Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton rounded="md" width="w-32" height="h-5" />
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-start gap-3">
              <Skeleton rounded="full" width="w-5" height="h-5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton rounded="sm" width="w-20" height="h-3" />
                <Skeleton rounded="md" width="w-36" height="h-5" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* Activity Feed */}
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
      <Skeleton rounded="md" width="w-40" height="h-5" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton rounded="full" width="w-8" height="h-8" />
          <div className="flex-1 space-y-1.5">
            <Skeleton rounded="md" width="w-3/4" height="h-4" />
            <Skeleton rounded="md" width="w-24" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// Dashboard Widget Skeleton
// ==========================================

export const DashboardWidgetSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton rounded="md" width="w-36" height="h-5" />
      <Skeleton rounded="lg" width="w-20" height="h-8" />
    </div>
    {/* Chart area placeholder */}
    <div className="h-40 flex items-end gap-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="sm"
          width="flex-1"
          height={`h-${[12, 20, 16, 28, 24, 32, 20, 36, 28, 24, 32, 40][i % 12] ?? 20}`}
        />
      ))}
    </div>
    <div className="flex items-center justify-between">
      <Skeleton rounded="md" width="w-24" height="h-4" />
      <Skeleton rounded="md" width="w-16" height="h-4" />
    </div>
  </div>
);

// ==========================================
// Form Skeleton
// ==========================================

interface FormSkeletonProps {
  fields?: number;
  columns?: 1 | 2;
  className?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 6,
  columns = 1,
  className = '',
}) => {
  const gridClass = columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4';

  return (
    <div className={`space-y-6 ${className}`}>
      <div className={gridClass}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton rounded="md" width="w-24" height="h-4" />
            <Skeleton rounded="xl" width="w-full" height="h-11" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Skeleton rounded="xl" width="w-20" height="h-10" />
        <Skeleton rounded="xl" width="w-24" height="h-10" />
      </div>
    </div>
  );
};

// ==========================================
// Notification Bell Skeleton
// ==========================================

export const NotificationListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="divide-y divide-slate-100 dark:divide-slate-800">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 p-4">
        <Skeleton rounded="xl" width="w-10" height="h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton rounded="md" width="w-4/5" height="h-4" />
          <div className="flex gap-2">
            <Skeleton rounded="full" width="w-16" height="h-5" />
            <Skeleton rounded="md" width="w-20" height="h-5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// Profile Header Skeleton
// ==========================================

export const ProfileHeaderSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ${className}`}>
    {/* Banner */}
    <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 animate-pulse" />
    {/* Avatar + Info */}
    <div className="px-6 pb-6 -mt-10 space-y-4">
      <Skeleton rounded="2xl" width="w-20" height="h-20" />
      <div className="space-y-2">
        <Skeleton rounded="lg" width="w-48" height="h-7" />
        <Skeleton rounded="md" width="w-32" height="h-5" />
        <div className="flex gap-2 pt-1">
          <Skeleton rounded="full" width="w-20" height="h-6" />
          <Skeleton rounded="full" width="w-24" height="h-6" />
        </div>
      </div>
    </div>
  </div>
);

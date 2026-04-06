import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-(--very-dark-color)/10",
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton components for common patterns
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// Enhanced skeleton for admin pages with proper layout structure
export function SkeletonAdminLayout() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6">
        <div className="min-w-0">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSummaryCard key={i} />
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={5} />
    </div>
  );
}

// Enhanced skeleton for collector page
export function SkeletonCollectorLayout() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSummaryCard key={i} />
        ))}
      </div>

      {/* Chart Card Skeleton */}
      <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-80 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={8} />
    </div>
  );
}

// Analytics page specific skeleton with 6 cards
export function SkeletonAnalyticsLayout() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6">
        <div className="min-w-0">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Grid Skeleton - 6 cards for analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonSummaryCard key={i} />
        ))}
      </div>

      {/* Charts Row 1 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-56 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Charts Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-lg border border-pale bg-paper p-6 space-y-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={5} />
    </div>
  );
}

export function SkeletonSummaryCard() {
  return (
    <div className="rounded-lg border border-pale bg-paper p-6">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-pale bg-paper overflow-hidden">
      <div className="p-4 border-b border-pale">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-pale">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="rounded-lg border border-pale bg-paper overflow-hidden">
      {/* Header */}
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-16 mb-4">
          <Skeleton className="w-32 h-32 rounded-full border-4 border-paper" />
        </div>
        {/* Badge */}
        <Skeleton className="h-6 w-28 rounded-full mb-4" />
        {/* Name & Business */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        {/* Contact */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonSummaryCard key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable rows={5} />
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

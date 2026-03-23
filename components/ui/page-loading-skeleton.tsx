import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic full-page loading state for App Router `loading.tsx`.
 * Keeps structure close to dashboard pages while staying neutral enough
 * for auth/admin/nursery/partner routes.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-pale">
      <div className="flex h-screen min-h-[100dvh] overflow-hidden">
        {/* Sidebar placeholder (desktop) */}
        <aside className="hidden md:flex md:w-64 lg:w-[17%] lg:min-w-[220px] lg:max-w-[320px] border-r border-[var(--border)] bg-[var(--card)] p-6 flex-col gap-4">
          <div className="space-y-2 pb-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top nav placeholder */}
          <header className="h-16 border-b border-[var(--border)] bg-paper px-4 sm:px-6 flex items-center justify-between">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
            <div className="w-full min-h-full flex flex-col gap-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-pale bg-paper p-5 space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 rounded-lg border border-pale bg-paper p-5 space-y-4">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-56 w-full rounded-lg" />
                </div>
                <div className="rounded-lg border border-pale bg-paper p-5 space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-pale bg-paper p-5 space-y-4 flex-1 flex flex-col">
                <Skeleton className="h-5 w-52" />
                <div className="space-y-2 flex-1 flex flex-col">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center flex-1 min-h-0">
                      <Skeleton className="col-span-3 h-4" />
                      <Skeleton className="col-span-4 h-4" />
                      <Skeleton className="col-span-2 h-4" />
                      <Skeleton className="col-span-3 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


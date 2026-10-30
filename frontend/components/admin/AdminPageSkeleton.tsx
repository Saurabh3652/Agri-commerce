/**
 * Shown the instant an admin link is clicked, while the page's data loads.
 * Each admin route folder has a one-line loading.tsx that uses this: on a client navigation
 * only the part below the shared layout re-renders, so the layout's own <Suspense> can't
 * show a fallback for moves between admin pages.
 */
export default function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-white" />
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

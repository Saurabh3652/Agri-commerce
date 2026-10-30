export const productGridClass = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4";

export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={productGridClass} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="aspect-[4/3] animate-pulse bg-brand-50" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
            <div className="h-7 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-12 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="surface-panel-elevated animate-pulseSoft rounded-2xl p-5">
      <div className="h-4 w-24 rounded-full bg-muted" />
      <div className="mt-4 h-9 w-32 rounded-full bg-muted" />
      <div className="mt-6 h-3 w-full rounded-full bg-muted" />
      <div className="mt-3 h-3 w-4/5 rounded-full bg-muted" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="page-shell">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-panel-elevated animate-pulseSoft min-h-[400px] rounded-3xl" />
        <div className="surface-panel-elevated animate-pulseSoft min-h-[400px] rounded-3xl" />
      </div>
    </div>
  );
}

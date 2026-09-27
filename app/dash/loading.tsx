// Placeholder while a dashboard page loads: a title, the metric strip and two
// panels, in the same shapes the pages use.
function Bar({ className }: { className: string }) {
  return <div className={`rounded-full bg-muted ${className}`} />;
}

export default function Loading() {
  return (
    <div className="page-shell animate-pulseSoft" aria-busy="true" aria-label="Loading">
      <div>
        <Bar className="h-4 w-24" />
        <Bar className="mt-3 h-9 w-64" />
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-surface xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`flex flex-col gap-3 border-border p-5 ${index ? "border-l" : ""}`}>
            <Bar className="h-3 w-20" />
            <Bar className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <Bar className="h-4 w-28" />
            </div>
            <div className="flex flex-col gap-4 p-5">
              {Array.from({ length: 4 }).map((__, row) => (
                <Bar key={row} className="h-3.5 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

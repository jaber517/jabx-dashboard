import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell items-center justify-center py-20">
      <div className="surface-panel-elevated max-w-xl rounded-3xl p-10 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you requested does not exist yet or has been moved into a
          different workspace section.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

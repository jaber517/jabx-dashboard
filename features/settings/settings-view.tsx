import { ShieldCheck, UploadCloud, Wifi, Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function SettingsView() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="A future-ready settings surface for storage, deployment, theming, and authentication planning."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wifi className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Offline-first architecture</CardTitle>
            <CardDescription>
              Data is structured for local SQLite storage with a service worker-backed shell for resilient usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Local database: SQLite via Prisma</p>
            <p>App shell caching: Service worker and web manifest</p>
            <p>Future sync readiness: Clean domain models and local-first data boundaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Deployment readiness</CardTitle>
            <CardDescription>
              The app is organized for later online deployment with a custom domain and external authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Next.js app router structure supports future hosted deployment.</p>
            <p>Database and page boundaries are clean enough to swap SQLite for a hosted database later.</p>
            <p>UI components are reusable and ready for form-driven CRUD expansion.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Authentication roadmap</CardTitle>
            <CardDescription>
              The schema includes future-facing ownership fields to make auth integration straightforward.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Add a `User` model and link `createdById` to authenticated identities.</p>
            <p>Introduce role-based access around private and shared project spaces.</p>
            <p>Expand API routes or server actions for secure data mutation later.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
              <Workflow className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Product refinement</CardTitle>
            <CardDescription>
              Ready areas for the next phase once the foundation is approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Server actions or forms for project, task, and note creation.</p>
            <p>Sync queues for true offline mutation and replay once online.</p>
            <p>Permissions, attachments, richer calendar views, and notifications.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Activity, CheckCircle2, FolderKanban, ListChecks } from "lucide-react";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import type { ProjectRecord, TaskRecord } from "@/types";

export function AnalyticsView({
  projects,
  tasks
}: {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
}) {
  const activeProjects = projects.filter((project) => project.status === "ACTIVE").length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const averageProgress =
    projects.length === 0
      ? 0
      : Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Project and task analytics designed for quick decision-making and weekly portfolio reviews."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Projects" value={String(projects.length)} icon={<FolderKanban className="h-5 w-5" />} />
        <MetricCard label="Active work" value={String(activeProjects)} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Task completion" value={`${completionRate}%`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <MetricCard label="Average progress" value={`${averageProgress}%`} icon={<ListChecks className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio analysis</CardTitle>
          <CardDescription>
            Visualize project status, workspace mix, and how task completion is trending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 && tasks.length === 0 ? (
            <EmptyState
              title="Analytics will appear after data is available"
              description="Run the Prisma seed to load the sample OCC, HSE, Training, AI Projects, and Personal data set."
            />
          ) : (
            <AnalyticsCharts projects={projects} tasks={tasks} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

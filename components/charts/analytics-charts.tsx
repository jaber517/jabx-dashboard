"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  categoryLabels,
  priorityLabels,
  statusLabels,
  taskStatusLabels
} from "@/lib/constants";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, TASK_PRIORITIES, TASK_STATUSES } from "@/types";
import type { ProjectRecord, TaskRecord } from "@/types";

const palette = ["#0A84FF", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e", "#8b5cf6", "#64748b"];

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--surface-elevated))",
  color: "hsl(var(--foreground))"
};

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };

export function AnalyticsCharts({
  projects,
  tasks
}: {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
}) {
  const projectsByStatus = PROJECT_STATUSES.map((status) => ({
    name: statusLabels[status],
    value: projects.filter((project) => project.status === status).length
  }));

  const projectsByCategory = PROJECT_CATEGORIES.map((category) => ({
    name: categoryLabels[category],
    value: projects.filter((project) => project.category === category).length
  }));

  const tasksByPriority = TASK_PRIORITIES.map((priority) => {
    const scoped = tasks.filter((task) => task.priority === priority);
    const completed = scoped.filter((task) => task.status === "DONE").length;

    return {
      name: priorityLabels[priority],
      total: scoped.length,
      completed
    };
  });

  const tasksByStatus = TASK_STATUSES.map((status) => ({
    name: taskStatusLabels[status],
    value: tasks.filter((task) => task.status === status).length
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={projectsByStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={4}
            >
              {projectsByStatus.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectsByCategory}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#0A84FF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={tasksByPriority}>
            <defs>
              <linearGradient id="priorityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#06b6d4"
              fill="url(#priorityGradient)"
              strokeWidth={3}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#0A84FF"
              fillOpacity={0}
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tasksByStatus}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

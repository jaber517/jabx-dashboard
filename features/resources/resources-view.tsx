"use client";

import { useDeferredValue, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels } from "@/lib/constants";
import { PROJECT_CATEGORIES } from "@/types";
import type { ResourceRecord } from "@/types";

export function ResourcesView({ resources }: { resources: ResourceRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const deferredQuery = useDeferredValue(query);

  const filteredResources = resources.filter((resource) => {
    const haystack = `${resource.title} ${resource.description} ${resource.type}`.toLowerCase();
    const matchesQuery = deferredQuery.length === 0 || haystack.includes(deferredQuery.toLowerCase());
    return matchesQuery && (category === "ALL" || resource.category === category);
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Library"
        title="Resources and links"
        description="A clean reference library for checklists, templates, source documents, and system links."
      />

      <Card>
        <CardHeader>
          <CardTitle>Find a resource</CardTitle>
          <CardDescription>
            Search by title, description, or type and narrow by category.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources..." />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filteredResources.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Try changing the search term or category to reveal more links."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              className="surface-panel-elevated rounded-3xl p-6 transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge className="bg-muted text-muted-foreground">
                  {categoryLabels[resource.category]}
                </Badge>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{resource.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{resource.type}</span>
                {resource.project ? <span>{resource.project.title}</span> : null}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

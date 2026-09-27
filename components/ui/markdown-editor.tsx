"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// A plain textarea with a Preview tab. The textarea stays mounted (hidden
// while previewing) so the form still submits its value.
export function MarkdownEditor({
  name,
  defaultValue = "",
  placeholder,
  required
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="grid gap-2">
      <div role="tablist" aria-label="Editor" className="flex gap-1">
        {(["write", "preview"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className={cn(
              "h-8 rounded-xl px-3 text-[13px] font-semibold capitalize transition-colors",
              tab === option ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">Markdown supported</span>
      </div>
      <Textarea
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn("min-h-[12rem] font-mono text-[13px] leading-6", tab === "preview" && "hidden")}
      />
      {tab === "preview" ? (
        <div className="min-h-[12rem] rounded-2xl border border-border bg-background px-4 py-3">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// Time-of-day greeting and today's date, computed in the browser so they
// follow the viewer's clock rather than the server's time zone.
export function Greeting({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  const hour = now?.getHours();
  const greeting =
    hour === undefined ? "Welcome back" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <p className="h-5 text-sm font-semibold text-muted-foreground">
        {now ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : null}
      </p>
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
        {greeting}, {name}.
      </h1>
    </div>
  );
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";

// Filter state that lives in the page address (?status=BLOCKED&project=…), so
// a view survives Back/Forward and can be bookmarked. Values equal to their
// default are left out of the URL. Updates use history.replaceState, which
// Next keeps in sync with useSearchParams without a server round-trip.
export function useUrlState<K extends string>(defaults: Record<K, string>) {
  const params = useSearchParams();
  const pathname = usePathname();

  const values = Object.fromEntries(
    (Object.keys(defaults) as K[]).map((key) => [key, params.get(key) ?? defaults[key]])
  ) as Record<K, string>;

  function set(patch: Partial<Record<K, string>>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch) as [K, string][]) {
      if (value === defaults[key] || value === "") next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return [values, set] as const;
}

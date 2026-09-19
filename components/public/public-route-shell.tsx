"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

// Keep the existing workspace shell and typography on all other routes.
export function PublicRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return ["/", "/projects", "/about", "/contact"].includes(pathname)
    ? children : <AppShell>{children}</AppShell>;
}

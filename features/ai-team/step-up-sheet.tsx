"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ScanFace, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TeamApiError } from "./api";
import { forgetStepUp, stepUp, stepUpFresh } from "./step-up";

export const NO_PASSKEY_TEXT = "Add Face ID in Settings to approve or start work from here";

export class StepUpError extends Error {
  constructor(
    message: string,
    readonly reason: "no_passkey" | "cancelled" | "failed"
  ) {
    super(message);
  }
}

type Guard = <T>(send: () => Promise<T>) => Promise<T>;
type Sheet = "waiting" | "no_passkey" | null;

const GuardContext = createContext<Guard>((send) => send());

/** Wraps an action that needs Face ID: checks first (unless still valid), then sends. */
export function useStepUpGuard(): Guard {
  return useContext(GuardContext);
}

export function StepUpProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<Sheet>(null);

  const guard = useCallback<Guard>(async (send) => {
    for (let attempt = 0; ; attempt += 1) {
      if (!stepUpFresh()) {
        setSheet("waiting");
        const result = await stepUp();
        if (!result.ok) {
          setSheet(result.reason === "no_passkey" ? "no_passkey" : null);
          throw new StepUpError(result.reason === "no_passkey" ? NO_PASSKEY_TEXT : result.message, result.reason);
        }
        setSheet(null);
      }
      try {
        return await send();
      } catch (error) {
        // The proof expired on the way (or came from another session): ask once more.
        if (error instanceof TeamApiError && error.code === "step_up_required" && attempt === 0) {
          forgetStepUp();
          continue;
        }
        if (error instanceof TeamApiError && error.code === "passkey_required") {
          setSheet("no_passkey");
          throw new StepUpError(NO_PASSKEY_TEXT, "no_passkey");
        }
        throw error;
      }
    }
  }, []);

  useEffect(() => {
    if (sheet !== "no_passkey") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSheet(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const value = useMemo(() => guard, [guard]);

  return (
    <GuardContext.Provider value={value}>
      {children}
      {sheet ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#07111B]/70 sm:items-center sm:p-4"
          onClick={sheet === "no_passkey" ? () => setSheet(null) : undefined}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="step-up-title"
            className="w-full rounded-t-3xl border-t border-border bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:max-w-sm sm:rounded-3xl sm:border sm:pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary">
                  <ScanFace className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 id="step-up-title" className="text-base font-bold">
                  Confirm with Face ID
                </h2>
              </div>
              {sheet === "no_passkey" ? (
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  aria-label="Close"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {sheet === "waiting" ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Waiting for Face ID…
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-foreground" role="alert">
                  {NO_PASSKEY_TEXT}.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/settings" className={cn(buttonVariants())} onClick={() => setSheet(null)}>
                    Open Settings
                  </Link>
                  <Button variant="secondary" onClick={() => setSheet(null)}>
                    Not now
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </GuardContext.Provider>
  );
}

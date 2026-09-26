import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-8 sm:p-8">
        <Wordmark className="h-10 w-auto text-foreground" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.04em] text-foreground">Private workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your passcode to sign in.</p>
        {searchParams.error === "1" ? (
          <p id="login-error" role="alert" className="mt-6 rounded-2xl border border-danger/40 p-4 text-sm font-medium text-danger">
            Wrong passcode. Please try again.
          </p>
        ) : null}
        <form action={login} className="mt-6 grid gap-3">
          <label htmlFor="password" className="text-sm font-semibold">Passcode</label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus
            aria-invalid={searchParams.error === "1"} aria-describedby={searchParams.error === "1" ? "login-error" : undefined} />
          <Button type="submit" className="mt-2 w-full">Sign in</Button>
        </form>
      </Card>
    </div>
  );
}

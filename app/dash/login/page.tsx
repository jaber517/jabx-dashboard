import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <Image src="/jabx-logo-header.jpg" alt="jabx" width={64} height={64} priority className="mx-auto rounded-2xl" />
        <h1 className="mt-6 text-center text-3xl font-semibold text-foreground">Private workspace</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">Enter your passcode to sign in.</p>
        {searchParams.error === "1" ? (
          <p id="login-error" role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            Wrong passcode. Please try again.
          </p>
        ) : null}
        <form action={login} className="mt-6 grid gap-3">
          <label htmlFor="password" className="text-sm font-medium">Passcode</label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus
            aria-invalid={searchParams.error === "1"} aria-describedby={searchParams.error === "1" ? "login-error" : undefined} />
          <Button type="submit" className="mt-2 w-full">Sign in</Button>
        </form>
      </Card>
    </div>
  );
}

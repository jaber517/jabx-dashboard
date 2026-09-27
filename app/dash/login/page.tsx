import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasskeySignIn } from "@/features/auth/passkey-sign-in";
import { login } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

const messages: Record<string, string> = {
  "1": "Wrong passcode. Please try again.",
  locked: "Too many wrong passcodes. Passcode sign-in is paused for a while; a passkey still works."
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const message = searchParams.error ? messages[searchParams.error] : undefined;

  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-8 sm:p-8">
        <Wordmark className="h-10 w-auto text-foreground" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.04em] text-foreground">Private workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
        {message ? (
          <p id="login-error" role="alert" className="mt-6 rounded-2xl border border-danger/40 p-4 text-sm font-medium text-danger">
            {message}
          </p>
        ) : null}
        <div className="mt-6">
          <PasskeySignIn />
        </div>
        <form action={login} className="mt-3 grid gap-3">
          <label htmlFor="password" className="text-sm font-semibold">Passcode</label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required
            aria-invalid={Boolean(message)} aria-describedby={message ? "login-error" : undefined} />
          <Button type="submit" variant="secondary" className="mt-2 w-full">Sign in with passcode</Button>
        </form>
      </Card>
    </div>
  );
}

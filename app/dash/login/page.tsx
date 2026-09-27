import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { Card } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/sign-in-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

const messages: Record<string, string> = {
  "1": "Wrong passcode. Please try again.",
  locked: "Too many wrong passcodes. Passcode sign-in is paused for a while; a passkey still works."
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-8 sm:p-8">
        <Wordmark className="h-10 w-auto text-foreground" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.04em] text-foreground">Private workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
        <SignInForm message={searchParams.error ? messages[searchParams.error] : undefined} />
      </Card>
    </div>
  );
}

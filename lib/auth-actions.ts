"use server";

import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { isPrivateHost } from "@/lib/hosts";
import {
  SESSION_COOKIE,
  expectedSessionToken,
  verifyPasscode
} from "@/lib/auth-config";

export async function login(formData: FormData): Promise<void> {
  if (!isPrivateHost(headers().get("host") ?? "")) notFound();
  const password = formData.get("password");

  const token = await expectedSessionToken();
  if (typeof password !== "string" || !token || !(await verifyPasscode(password))) {
    // Slow each wrong guess down; with a long passphrase this makes online guessing impractical.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    redirect("/login?error=1");
  }

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  if (!isPrivateHost(headers().get("host") ?? "")) notFound();
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

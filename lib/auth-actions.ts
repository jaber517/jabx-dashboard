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

  if (typeof password !== "string" || !(await verifyPasscode(password))) {
    redirect("/login?error=1");
  }

  cookies().set(SESSION_COOKIE, await expectedSessionToken(), {
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

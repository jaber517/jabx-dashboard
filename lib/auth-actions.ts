"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  expectedSessionToken,
  verifyPasscode
} from "@/lib/auth-config";

export async function login(formData: FormData): Promise<void> {
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
  cookies().delete(SESSION_COOKIE);
  redirect("/");
}

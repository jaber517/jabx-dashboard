"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function login(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || typeof password !== "string" || password !== expected) {
    redirect("/login?error=1");
  }

  const token = sessionToken();

  if (!token) {
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
  cookies().delete(SESSION_COOKIE);
  redirect("/");
}

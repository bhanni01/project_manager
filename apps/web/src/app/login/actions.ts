"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const reason = err.type === "CredentialsSignin" ? "credentials" : "unknown";
      redirect(`/login?error=${reason}`);
    }
    throw err;
  }

  redirect("/dashboard");
}

"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const staffPassword = process.env.STAFF_PASSWORD;

  if (!staffPassword || password !== staffPassword) {
    return { error: "Contraseña incorrecta." };
  }

  const session = await getSession();
  session.isStaff = true;
  await session.save();

  redirect("/staff/dashboard");
}

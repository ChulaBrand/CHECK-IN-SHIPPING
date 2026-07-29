import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function StaffLoginPage() {
  const session = await getSession();
  if (session.isStaff) {
    redirect("/staff/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}

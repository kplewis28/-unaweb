import { redirect } from "next/navigation";
import AccountClient from "./AccountClient";
import { isAdminEmail } from "@/lib/admin-auth";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default async function AccountPage() {
  if (IS_MOCK) {
    return <AccountClient userEmail={process.env.ADMIN_EMAIL ?? "admin@una.eco"} mockMode />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");

  return <AccountClient userEmail={user.email ?? ""} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Application } from "@/lib/supabase/types";
import DashboardClient from "./DashboardClient";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default async function DashboardPage() {
  let applications: Application[] = [];
  let userEmail = process.env.ADMIN_EMAIL ?? "admin@una.eco";

  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
      redirect("/admin/login");
    }
    applications = MOCK_APPLICATIONS;
    return <DashboardClient applications={applications} userEmail={userEmail} />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  userEmail = user?.email ?? "";

  const { data, error } = await supabase
    .from("applications")
    .select("*, retreat:retreats(*)")
    .order("created_at", { ascending: false });

  if (error) console.error("Dashboard fetch error:", error);
  applications = (data as Application[]) ?? [];

  return <DashboardClient applications={applications} userEmail={userEmail} />;
}

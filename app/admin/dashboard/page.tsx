import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Application, ContactMessage } from "@/lib/supabase/types";
import DashboardClient from "./DashboardClient";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default async function DashboardPage() {
  let applications: Application[] = [];
  let messages: ContactMessage[] = [];
  let userEmail = process.env.ADMIN_EMAIL ?? "admin@una.eco";

  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
      redirect("/admin/login");
    }
    applications = MOCK_APPLICATIONS;
    return <DashboardClient applications={applications} messages={messages} userEmail={userEmail} />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  userEmail = user?.email ?? "";

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const cookieHeader = headersList.get("cookie") ?? "";
  const fetchOpts = { headers: { cookie: cookieHeader }, cache: "no-store" as const };

  const [appsRes, messagesRes] = await Promise.all([
    fetch(`${protocol}://${host}/api/admin/applications`, fetchOpts),
    fetch(`${protocol}://${host}/api/admin/contact-messages`, fetchOpts),
  ]);

  if (!appsRes.ok) {
    console.error("Dashboard applications fetch error:", await appsRes.text());
  } else {
    const json = await appsRes.json();
    applications = (json.applications as Application[]) ?? [];
  }

  if (!messagesRes.ok) {
    console.error("Dashboard messages fetch error:", await messagesRes.text());
  } else {
    const json = await messagesRes.json();
    messages = (json.messages as ContactMessage[]) ?? [];
  }

  return <DashboardClient applications={applications} messages={messages} userEmail={userEmail} />;
}

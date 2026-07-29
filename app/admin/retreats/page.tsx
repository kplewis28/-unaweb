import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Retreat } from "@/lib/supabase/types";
import RetreatsClient from "./RetreatsClient";
import { MOCK_RETREAT } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin-auth";

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default async function RetreatsPage() {
  let retreats: Retreat[] = [];
  let applicationCounts: Record<string, number> = {};
  let userEmail = process.env.ADMIN_EMAIL ?? "admin@una.eco";

  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
      redirect("/admin/login");
    }
    retreats = [MOCK_RETREAT];
    return <RetreatsClient retreats={retreats} applicationCounts={applicationCounts} userEmail={userEmail} />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) redirect("/admin/login");

  userEmail = user?.email ?? "";

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const cookieHeader = headersList.get("cookie") ?? "";

  const res = await fetch(`${protocol}://${host}/api/admin/retreats`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Retreats fetch error:", await res.text());
  } else {
    const json = await res.json();
    retreats = (json.retreats as Retreat[]) ?? [];
    applicationCounts = (json.applicationCounts as Record<string, number>) ?? {};
  }

  return <RetreatsClient retreats={retreats} applicationCounts={applicationCounts} userEmail={userEmail} />;
}

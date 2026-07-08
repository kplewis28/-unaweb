import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendApprovalEmail } from "@/lib/email/send-approval-email";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import type { Application } from "@/lib/supabase/types";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}`;
}

async function sendApprovalAndRespond(application: Application, accessCode: string, expiresAt: Date) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
  const paymentUrl = `${baseUrl}/pagar?code=${accessCode}`;

  const emailResult = await sendApprovalEmail({
    toName: application.name,
    toEmail: application.email,
    retreatName: application.retreat?.name ?? "el retiro",
    accessCode,
    expiresAt,
    paymentUrl,
  });

  if (!emailResult.success) {
    console.error("[send-approval-email] failed:", emailResult.error);
  }

  return emailResult;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const { action } = body;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (IS_MOCK) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const application = MOCK_APPLICATIONS.find((a) => a.id === id);
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    if (application.status !== "pending") {
      return NextResponse.json({ error: "Application already processed." }, { status: 409 });
    }

    if (action === "reject") {
      application.status = "rejected";
      application.updated_at = new Date().toISOString();
      return NextResponse.json({ ok: true, name: application.name });
    }

    const accessCode = generateAccessCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    application.status = "approved";
    application.access_code = accessCode;
    application.access_code_expires_at = expiresAt.toISOString();
    application.updated_at = new Date().toISOString();

    const emailResult = await sendApprovalAndRespond(application, accessCode, expiresAt);
    application.access_code_email_sent = emailResult.success;

    return NextResponse.json({
      ok: true,
      name: application.name,
      accessCode,
      emailSent: emailResult.success,
    });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Fetch application + retreat
  const { data: applicationRaw, error: fetchError } = await supabase
    .from("applications")
    .select("*, retreat:retreats(*)")
    .eq("id", id)
    .single();

  const application = applicationRaw as Application | null;

  if (fetchError || !application || !applicationRaw) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json({ error: "Application already processed." }, { status: 409 });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("applications")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[PATCH /api/admin/applications] reject error:", error);
      return NextResponse.json({ error: "Failed to reject application." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, name: application.name });
  }

  // --- APPROVE ---
  const accessCode = generateAccessCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "approved",
      access_code: accessCode,
      access_code_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("[PATCH /api/admin/applications] approve error:", updateError);
    return NextResponse.json({ error: "Failed to approve application." }, { status: 500 });
  }

  // Send approval email (non-blocking — failure does NOT revert approval)
  const emailResult = await sendApprovalAndRespond(application, accessCode, expiresAt);

  if (emailResult.success) {
    await supabase
      .from("applications")
      .update({ access_code_email_sent: true })
      .eq("id", id);
  }

  return NextResponse.json({
    ok: true,
    name: application.name,
    accessCode,
    emailSent: emailResult.success,
  });
}

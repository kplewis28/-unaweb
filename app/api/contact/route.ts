import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const CONTACT_NOTIFICATION_EMAIL = "unafest@gmail.com";

async function notifyContactMessage(params: {
  name: string;
  email: string;
  interest?: string | null;
  message?: string | null;
}): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: CONTACT_NOTIFICATION_EMAIL,
      replyTo: params.email,
      subject: "Nuevo mensaje de contacto - una.eco",
      html: `
        <p><strong>Name:</strong> ${params.name}</p>
        <p><strong>Email:</strong> ${params.email}</p>
        ${params.interest ? `<p><strong>Writing about:</strong> ${params.interest}</p>` : ""}
        ${params.message ? `<p><strong>Message:</strong><br/>${params.message}</p>` : ""}
      `,
    });
    if (error) {
      console.error("[notifyContactMessage]", error.message);
      return false;
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[notifyContactMessage]", message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, interest, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    // Save to Supabase and notify by email independently — a failure in one
    // (e.g. the contact_messages table not existing yet) should not stop
    // the other from being the message's only surviving record.
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      interest: interest?.trim() || null,
      message: message?.trim() || null,
    });

    if (dbError) {
      console.error("[POST /api/contact]", dbError);
    }

    const emailSent = await notifyContactMessage({
      name: name.trim(),
      email: email.trim(),
      interest,
      message,
    });

    if (dbError && !emailSent) {
      return NextResponse.json({ error: "Failed to save message." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

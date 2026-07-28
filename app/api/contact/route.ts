import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, nameSchema, messageSchema, firstZodError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

const CONTACT_NOTIFICATION_EMAIL = "unafest@gmail.com";

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  interest: z.string().trim().max(300).optional().nullable(),
  message: messageSchema,
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function notifyContactMessage(params: {
  name: string;
  email: string;
  interest?: string | null;
  message?: string | null;
}): Promise<boolean> {
  try {
    const name = escapeHtml(params.name);
    const email = escapeHtml(params.email);
    const interest = params.interest ? escapeHtml(params.interest) : null;
    const message = params.message ? escapeHtml(params.message) : null;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: CONTACT_NOTIFICATION_EMAIL,
      replyTo: params.email,
      subject: "Nuevo mensaje de contacto - una.eco",
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${interest ? `<p><strong>Writing about:</strong> ${interest}</p>` : ""}
        ${message ? `<p><strong>Message:</strong><br/>${message}</p>` : ""}
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
    const rateLimit = checkRateLimit(request, "contact", { limit: 5, windowSeconds: 60 * 60 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many messages sent. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    }
    const { name, email, interest, message } = parsed.data;

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

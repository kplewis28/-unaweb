import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReminderEmail } from "@/lib/email/send-payment-reminder-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retreat_id, retreat_slug, name, email, country, profession, why_attend, how_heard, social_media, num_attendees } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (!retreat_id && !retreat_slug) {
      return NextResponse.json({ error: "Retreat is required." }, { status: 400 });
    }

    // Uses the service client: duplicate detection below needs to reliably
    // read existing applications, which anon-key RLS filters out.
    const supabase = await createServiceClient();

    // Look up retreat by slug or id
    const query = supabase.from("retreats").select("*").eq("is_open", true);
    const { data: retreat } = retreat_slug
      ? await query.eq("slug", retreat_slug).single()
      : await query.eq("id", retreat_id).single();

    if (!retreat) {
      return NextResponse.json({ error: "Retreat not found or no longer active." }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing } = await supabase
      .from("applications")
      .select("*")
      .eq("retreat_id", retreat.id)
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Ya tienes una aplicación en revisión, te contactaremos pronto" },
          { status: 409 }
        );
      }

      if (existing.status === "paid") {
        return NextResponse.json(
          { error: "Ya estás inscrita en este retiro" },
          { status: 409 }
        );
      }

      if (existing.status === "approved") {
        const isExpired = existing.access_code_expires_at
          ? new Date(existing.access_code_expires_at) < new Date()
          : true;

        if (!isExpired && existing.access_code) {
          const expiresAt = new Date(existing.access_code_expires_at);
          const hoursRemaining = Math.max(
            1,
            Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
          );
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
          const paymentUrl = `${baseUrl}/pagar?code=${existing.access_code}`;

          const emailResult = await sendPaymentReminderEmail({
            toName: existing.name,
            toEmail: existing.email,
            retreatName: retreat.name,
            accessCode: existing.access_code,
            expiresAt,
            hoursRemaining,
            paymentUrl,
          });

          return NextResponse.json({
            ok: true,
            message: "You already have an approved spot — we've re-sent your access code by email.",
            emailSent: emailResult.success,
          });
        }
        // status is "approved" but the access code has expired: fall through
        // and let them submit a fresh application below.
      }

      // "rejected", or "approved" with an expired code: fall through to
      // create a new application normally.
    }

    const newApplication = {
      retreat_id: retreat.id,
      name: name.trim(),
      email: normalizedEmail,
      country: country?.trim() || null,
      profession: profession?.trim() || null,
      why_attend: why_attend?.trim() || null,
      how_heard: how_heard || null,
      social_media: social_media?.trim() || null,
      num_attendees: Math.max(1, Number(num_attendees) || 1),
      status: "pending",
    };

    let { error } = await supabase.from("applications").insert(newApplication);

    // The num_attendees column may not exist yet (pending migration) —
    // retry without it rather than failing the whole submission.
    if (error?.code === "PGRST204" && error.message.includes("num_attendees")) {
      const { num_attendees: _num_attendees, ...withoutAttendees } = newApplication;
      void _num_attendees;
      ({ error } = await supabase.from("applications").insert(withoutAttendees));
    }

    if (error) {
      console.error("[POST /api/applications]", error);
      return NextResponse.json({ error: "Failed to save application." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

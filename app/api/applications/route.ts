import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReminderEmail } from "@/lib/email/send-payment-reminder-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      retreat_id,
      retreat_slug,
      name,
      email,
      country,
      profession,
      how_heard,
      social_media,
      num_attendees,
      phone,
      q_draw,
      q_work_intersection,
      q_responsible_participation,
      org_connection,
      travel_availability,
      investment_comfort,
    } = body;

    const requiredFields: Record<string, unknown> = {
      "Full name": name,
      Email: email,
      "Country of residence": country,
      "LinkedIn / Website": social_media,
      "Mobile / WhatsApp": phone,
      "What draws you to this gathering": q_draw,
      "How your work intersects": q_work_intersection,
      "What responsible participation means to you": q_responsible_participation,
      "Travel availability": travel_availability,
      "Investment comfort": investment_comfort,
    };
    const missingField = Object.entries(requiredFields).find(([, value]) => !`${value ?? ""}`.trim());
    if (missingField) {
      return NextResponse.json({ error: `${missingField[0]} is required.` }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!/^https?:\/\/.+/i.test(social_media.trim())) {
      return NextResponse.json({ error: "Please enter a valid LinkedIn / Website URL." }, { status: 400 });
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
            alreadyApproved: true,
            message: "You already have an approved spot — we've re-sent your access code by email.",
            emailSent: emailResult.success,
          });
        }
        // status is "approved" but the access code has expired: mark it as
        // such so it stops showing as an active approval, then fall through
        // and let them submit a fresh application below.
        await supabase
          .from("applications")
          .update({ status: "expired" })
          .eq("id", existing.id);
      }

      // "rejected", or "approved" with an expired code: fall through to
      // create a new application normally.
    }

    const newApplication: Record<string, unknown> = {
      retreat_id: retreat.id,
      name: name.trim(),
      email: normalizedEmail,
      country: country?.trim() || null,
      profession: profession?.trim() || null,
      how_heard: how_heard || null,
      social_media: social_media?.trim() || null,
      num_attendees: Math.max(1, Number(num_attendees) || 1),
      phone: phone?.trim() || null,
      q_draw: q_draw?.trim() || null,
      q_work_intersection: q_work_intersection?.trim() || null,
      q_responsible_participation: q_responsible_participation?.trim() || null,
      org_connection: org_connection || null,
      travel_availability: travel_availability || null,
      investment_comfort: investment_comfort || null,
      status: "pending",
    };

    // Columns added alongside a form update sometimes lag behind on the
    // live schema until the migration is run — retry stripping whichever
    // column PostgREST reports missing rather than failing the submission.
    let error: { code?: string; message: string } | null = null;
    for (let attempt = 0; attempt < Object.keys(newApplication).length; attempt++) {
      ({ error } = await supabase.from("applications").insert(newApplication));
      if (!error) break;
      const missingColumn = error.code === "PGRST204" ? error.message.match(/'([^']+)' column/)?.[1] : null;
      if (!missingColumn || !(missingColumn in newApplication)) break;
      delete newApplication[missingColumn];
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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Deliberately loose validation on the password (no format/complexity
// checks) — this endpoint must not leak anything about the password
// policy to an unauthenticated caller. Only a sane max length to reject
// absurd payloads.
const loginSchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "admin-login", { limit: 5, windowSeconds: 15 * 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    // Same generic message as a failed login — don't confirm/deny the
    // shape of valid credentials to an unauthenticated caller.
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

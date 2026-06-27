import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    emailSet: !!process.env.ADMIN_EMAIL,
    passwordSet: !!process.env.ADMIN_PASSWORD,
    secretSet: !!process.env.SESSION_SECRET,
    isMock: !process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

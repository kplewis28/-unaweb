import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

// Cookie name must match the one in lib/session.ts
const SESSION_COOKIE = "una_session";

// Reachable without an existing session — signing in, and the two
// password-recovery steps (request a link, then set a new password from
// that emailed link). Everything else under /admin requires auth.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export async function middleware(request: NextRequest) {
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.includes(request.nextUrl.pathname);

  if (IS_MOCK) {
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    // Only check presence here; full HMAC verification happens in the dashboard page
    const hasSession = request.cookies.has(SESSION_COOKIE);

    if (isAdminRoute && !isPublicAdminPath && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (request.nextUrl.pathname === "/admin/login" && hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !isPublicAdminPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // /admin/reset-password is deliberately excluded here even when a
  // session exists — clicking the emailed recovery link establishes a
  // real (if narrowly-scoped) session, and this bounce would otherwise
  // fire before the page's client-side code gets a chance to read it.
  if (request.nextUrl.pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};

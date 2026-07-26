import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

interface ActiveRetreat {
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  total_spots: number;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const endMonth = end.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}-${endDay} ${endMonth} ${endYear}`;
  }
  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

function renderLocationHtml(location: string): string {
  const escaped = escapeHtml(location);
  const lastComma = escaped.lastIndexOf(",");
  if (lastComma === -1) return escaped;
  const main = escaped.slice(0, lastComma).trim();
  const country = escaped.slice(lastComma + 1).trim();
  return country ? `${main}, <em>${country}</em>` : main;
}

// A short "Sierra Nevada · Colombia" style label for the compact eyebrow
// lines (hero, registration modal) — drops a "de Santa Marta"-style
// qualifier from the main segment so it stays a short one-line label.
function shortLocationLabel(location: string): string {
  const escaped = escapeHtml(location);
  const lastComma = escaped.lastIndexOf(",");
  const main = lastComma === -1 ? escaped : escaped.slice(0, lastComma).trim();
  const country = lastComma === -1 ? "" : escaped.slice(lastComma + 1).trim();
  const shortMain = main.split(/\s+de\s+/i)[0].trim();
  return country ? `${shortMain} · ${country}` : shortMain;
}

function replaceMarker(html: string, key: string, value: string): string {
  const re = new RegExp(`<!--RETREAT:${key}-->[\\s\\S]*?<!--/RETREAT:${key}-->`, "g");
  return html.replace(re, value);
}

async function fetchActiveRetreat(request: NextRequest): Promise<ActiveRetreat | null> {
  // Resolve against the request's own host (matches the pattern used by
  // app/admin/dashboard/page.tsx) rather than a hardcoded production
  // domain — otherwise local/dev/preview environments would silently fetch
  // production data instead of their own, which is confusing to test.
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco");

  const res = await fetch(`${baseUrl}/api/retreats/active`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const { retreat } = await res.json();
  return retreat ?? null;
}

export async function GET(request: NextRequest) {
  let html = readFileSync(join(process.cwd(), "public", "site.html"), "utf-8");

  try {
    const retreat = await fetchActiveRetreat(request);

    if (retreat) {
      const dateRange = formatDateRange(retreat.start_date, retreat.end_date);
      const locationHtml = retreat.location ? renderLocationHtml(retreat.location) : "Location to be announced";
      const descText = retreat.description?.trim()
        ? escapeHtml(retreat.description)
        : "Join us for our next gathering.";
      const eyebrowText = retreat.location
        ? `${shortLocationLabel(retreat.location)} · ${dateRange}`
        : dateRange;

      html = replaceMarker(html, "HERO_DATE", eyebrowText);
      html = replaceMarker(html, "MODAL_DATE", eyebrowText);
      html = replaceMarker(html, "LOCATION", locationHtml);
      html = replaceMarker(html, "DATE", dateRange);
      html = replaceMarker(html, "DESC", descText);
      html = replaceMarker(html, "APPLY_DATE", dateRange);
    } else {
      // No open upcoming retreat right now (e.g. registration was closed
      // with nothing new open yet). Show an honest placeholder instead of
      // silently leaving whatever specific date happens to be hardcoded in
      // site.html — that copy will otherwise go stale the moment this
      // gathering's date passes, and nobody editing /admin/retreats would
      // know to update it.
      const noneText = "To be announced";
      html = replaceMarker(html, "HERO_DATE", noneText);
      html = replaceMarker(html, "MODAL_DATE", noneText);
      html = replaceMarker(html, "LOCATION", noneText);
      html = replaceMarker(html, "DATE", noneText);
      html = replaceMarker(html, "DESC", "Stay tuned for our next gathering.");
      html = replaceMarker(html, "APPLY_DATE", noneText);
    }
  } catch (err) {
    // Network error/exception talking to /api/retreats/active — genuinely
    // unknown state, so leave the static copy in site.html untouched rather
    // than guess or show a "to be announced" placeholder that may be wrong.
    console.error("[GET /] failed to load active retreat, serving static copy:", err);
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

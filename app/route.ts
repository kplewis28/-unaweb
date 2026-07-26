import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

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

function replaceMarker(html: string, key: string, value: string): string {
  const re = new RegExp(`<!--RETREAT:${key}-->[\\s\\S]*?<!--/RETREAT:${key}-->`, "g");
  return html.replace(re, value);
}

async function fetchActiveRetreat(): Promise<ActiveRetreat | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://una.eco";
  const res = await fetch(`${baseUrl}/api/retreats/active`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const { retreat } = await res.json();
  return retreat ?? null;
}

export async function GET() {
  let html = readFileSync(join(process.cwd(), "public", "site.html"), "utf-8");

  try {
    const retreat = await fetchActiveRetreat();
    if (retreat) {
      const dateRange = formatDateRange(retreat.start_date, retreat.end_date);
      const locationHtml = retreat.location ? renderLocationHtml(retreat.location) : "Location to be announced";
      const descText = retreat.description?.trim()
        ? escapeHtml(retreat.description)
        : "Join us for our next gathering.";

      html = replaceMarker(html, "HERO_DATE", dateRange);
      html = replaceMarker(html, "MODAL_DATE", dateRange);
      html = replaceMarker(html, "LOCATION", locationHtml);
      html = replaceMarker(html, "DATE", dateRange);
      html = replaceMarker(html, "DESC", descText);
      html = replaceMarker(html, "APPLY_DATE", dateRange);
    }
  } catch (err) {
    console.error("[GET /] failed to load active retreat, serving static copy:", err);
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

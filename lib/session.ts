import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "una_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionToken(): string {
  const payload = `session:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
  } catch {
    return false;
  }
  const ts = parseInt(payload.split(":")[1]);
  return Number.isFinite(ts) && Date.now() - ts < MAX_AGE_MS;
}

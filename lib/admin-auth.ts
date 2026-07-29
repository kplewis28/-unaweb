/**
 * There is exactly one admin account for this app (no self-serve admin
 * signup flow exists in the UI). Supabase's own "allow new users to sign
 * up" project setting is a separate, dashboard-only toggle — this check
 * is defense-in-depth so that even a stray/rogue Supabase Auth account
 * can never pass as admin, only the one matching ADMIN_EMAIL.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

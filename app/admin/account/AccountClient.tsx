"use client";

import { useState } from "react";
import AdminNav from "../AdminNav";
import { passwordSchema } from "@/lib/validation";

interface Props {
  userEmail: string;
  mockMode?: boolean;
}

export default function AccountClient({ userEmail, mockMode }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Re-verify the current password before changing anything — a valid
      // session alone (e.g. an unattended logged-in browser) shouldn't be
      // enough to take over the account.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (verifyError) {
        setError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-warm)" }}>
      <AdminNav
        right={
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", rowGap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--cream)", opacity: 0.7,
                maxWidth: "35vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </span>
            <span style={{ width: "1px", height: "16px", background: "rgba(171,170,112,0.3)" }} />
            <a href="/admin/dashboard" className="una-btn-ghost-dark" style={{ textDecoration: "none" }}>
              Back to dashboard
            </a>
          </div>
        }
      />

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "64px clamp(20px, 4vw, 48px) 100px" }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-serif)", fontWeight: 400,
            fontSize: "clamp(28px, 3vw, 36px)", color: "var(--olive)",
          }}
        >
          Change password
        </h1>
        <p style={{ margin: "0 0 36px", fontFamily: "var(--font-sans)", fontSize: "11px", letterSpacing: "0.04em", color: "var(--sage)" }}>
          {userEmail}
        </p>

        {mockMode ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--sage)", lineHeight: 1.6 }}>
            Password changes aren&apos;t available in this preview environment.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "22px" }}>
              <label htmlFor="currentPassword" className="una-input-label">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="una-input"
                placeholder="••••••••"
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label htmlFor="newPassword" className="una-input-label">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="una-input"
                placeholder="••••••••"
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label htmlFor="confirmPassword" className="una-input-label">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="una-input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                style={{
                  display: "flex", alignItems: "flex-start", gap: "9px", marginBottom: "22px",
                  padding: "11px 13px", background: "rgba(139,58,42,0.06)", border: "1px solid rgba(139,58,42,0.25)",
                }}
              >
                <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--error)", lineHeight: 1.5 }}>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div
                style={{
                  display: "flex", alignItems: "flex-start", gap: "9px", marginBottom: "22px",
                  padding: "11px 13px", background: "rgba(58,107,58,0.06)", border: "1px solid rgba(58,107,58,0.25)",
                }}
              >
                <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--success)", lineHeight: 1.5 }}>
                  Password updated.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="una-btn">
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import AdminNav from "../AdminNav";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // Deliberately not window.location.origin: una.eco (apex) 308s to
      // www.una.eco, so the origin at request time is unpredictable and
      // Supabase's redirect URL allow-list only has to trust one fixed
      // value this way instead of every domain variant that resolves here.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/admin/reset-password`,
      });
      // There's exactly one admin account and its email isn't a secret in
      // this context, so surface real failures (e.g. rate limiting)
      // instead of always claiming success — that's only worth doing when
      // hiding account existence actually matters.
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream-warm)" }}>
      <AdminNav />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <h1
            style={{
              margin: "0 0 6px",
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "26px",
              color: "var(--olive)",
              lineHeight: 1.2,
            }}
          >
            Reset your password
          </h1>

          {IS_MOCK ? (
            <p style={{ margin: "24px 0 0", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--sage)", lineHeight: 1.6 }}>
              Password reset isn&apos;t available in this preview environment.
            </p>
          ) : sent ? (
            <>
              <p style={{ margin: "0 0 28px", fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--sage)", letterSpacing: "0.01em", lineHeight: 1.6 }}>
                If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder) — the link expires after a while, so use it soon.
              </p>
              <a href="/admin/login" className="una-btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>
                Back to sign in
              </a>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 32px", fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--sage)", letterSpacing: "0.01em", lineHeight: 1.6 }}>
                Enter your admin email and we&apos;ll send you a link to set a new password.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "22px" }}>
                  <label htmlFor="email" className="una-input-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="una-input"
                    placeholder="admin@una.eco"
                  />
                </div>

                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "9px",
                      marginBottom: "22px",
                      padding: "11px 13px",
                      background: "rgba(139,58,42,0.06)",
                      border: "1px solid rgba(139,58,42,0.25)",
                    }}
                  >
                    <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--error)", lineHeight: 1.5 }}>
                      {error}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="una-btn" style={{ width: "100%" }}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <a
                href="/admin/login"
                style={{
                  display: "inline-block",
                  marginTop: "28px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--sage)",
                  textDecoration: "none",
                  opacity: 0.7,
                }}
              >
                ← Back to sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

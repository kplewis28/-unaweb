"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";
import { passwordSchema } from "@/lib/validation";

type Status = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRecoverySession() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // The recovery link's tokens are parsed from the URL automatically
      // (detectSessionInUrl) as soon as the client is created, but that
      // parsing is async — poll getSession briefly rather than assuming
      // it's already resolved on the first check.
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setStatus("ready");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!cancelled) setStatus("invalid");
    }

    checkRecoverySession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/admin/dashboard"), 1800);
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
            Set a new password
          </h1>

          {status === "checking" && (
            <p style={{ margin: "24px 0 0", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--sage)" }}>
              Verifying your reset link…
            </p>
          )}

          {status === "invalid" && (
            <>
              <p style={{ margin: "24px 0 24px", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--error)", lineHeight: 1.6 }}>
                This reset link is invalid or has expired.
              </p>
              <a href="/admin/forgot-password" className="una-btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>
                Request a new link
              </a>
            </>
          )}

          {status === "ready" && done && (
            <p style={{ margin: "24px 0 0", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--success)", lineHeight: 1.6 }}>
              Password updated. Taking you to the dashboard…
            </p>
          )}

          {status === "ready" && !done && (
            <>
              <p style={{ margin: "0 0 32px", fontFamily: "var(--font-sans)", fontSize: "11.5px", color: "var(--sage)", letterSpacing: "0.01em", lineHeight: 1.6 }}>
                Choose a new password for your admin account.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "22px" }}>
                  <label htmlFor="password" className="una-input-label">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoFocus
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

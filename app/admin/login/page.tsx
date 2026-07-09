"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../AdminNav";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (IS_MOCK) {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Invalid credentials.");
          return;
        }
      } else {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError("Invalid credentials. Please check your email and password.");
          return;
        }
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--cream-warm)" }}>
      <AdminNav />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        }}
        className="admin-login-grid"
      >
        {/* Left: form */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px clamp(24px, 6vw, 64px)",
          }}
        >
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
              Sign in
            </h1>
            <p
              style={{
                margin: "0 0 32px",
                fontFamily: "var(--font-sans)",
                fontSize: "11.5px",
                color: "var(--sage)",
                letterSpacing: "0.01em",
              }}
            >
              Restricted access — applications dashboard
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

              <div style={{ marginBottom: "28px" }}>
                <label htmlFor="password" className="una-input-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <svg width="13" height="13" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="var(--error)" strokeWidth="1.2" />
                    <path d="M5.5 5.5L9.5 9.5M9.5 5.5L5.5 9.5" stroke="var(--error)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-sans)",
                      fontSize: "11.5px",
                      color: "var(--error)",
                      letterSpacing: "0.01em",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="una-btn"
                style={{ width: "100%" }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <a
              href="/"
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
                transition: "opacity 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              ← Back to una.eco
            </a>
          </div>
        </div>

        {/* Right: image */}
        <div
          className="admin-login-image"
          style={{
            position: "relative",
            backgroundImage: "url(/assets/images/login-hair-palms.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(1) contrast(1.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(71,62,15,0) 0%, rgba(71,62,15,0.35) 100%)",
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .admin-login-grid { grid-template-columns: 1fr !important; }
          .admin-login-image { display: none; }
        }
      `}</style>
    </div>
  );
}

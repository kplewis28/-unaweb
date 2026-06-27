"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "var(--cream-warm)",
      }}
    >
      <a
        href="/"
        style={{
          position: "fixed",
          top: "24px",
          left: "28px",
          fontFamily: "var(--font-sans)",
          fontSize: "10px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--sage)",
          textDecoration: "none",
          opacity: 0.75,
          transition: "opacity 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
      >
        ← Volver
      </a>

      <div style={{ width: "100%", maxWidth: "360px" }}>
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p
            style={{
              margin: "0 0 16px",
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--sage)",
            }}
          >
            ÚNA
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "28px",
              color: "var(--olive)",
              lineHeight: 1.2,
            }}
          >
            Portal de administración
          </h1>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "var(--sage)",
              margin: "20px auto 0",
              opacity: 0.6,
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "28px" }}>
            <label htmlFor="email" className="una-input-label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="una-input"
              placeholder="hola@una.eco"
            />
          </div>

          <div style={{ marginBottom: "36px" }}>
            <label htmlFor="password" className="una-input-label">
              Contraseña
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
            <p
              style={{
                margin: "0 0 20px",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "var(--error)",
                letterSpacing: "0.02em",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="una-btn"
            style={{ width: "100%" }}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: "48px",
            textAlign: "center",
            fontFamily: "var(--font-sans)",
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--sage)",
            opacity: 0.7,
          }}
        >
          una.eco
        </p>
      </div>
    </div>
  );
}

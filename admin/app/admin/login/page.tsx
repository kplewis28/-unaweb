"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
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

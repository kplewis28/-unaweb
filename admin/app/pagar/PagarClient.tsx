"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PagarClient() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) setCode(codeParam);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Código no válido.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
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
        padding: "60px 24px",
        background: "var(--cream-warm)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p
            style={{
              margin: "0 0 12px",
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
              fontSize: "30px",
              color: "var(--olive)",
              lineHeight: 1.2,
            }}
          >
            Confirmar lugar
          </h1>
          <p
            style={{
              margin: "14px 0 0",
              fontFamily: "var(--font-serif)",
              fontSize: "17px",
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            Ingresa tu código de acceso para proceder al pago y reservar tu lugar.
          </p>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "32px" }}>
            <label htmlFor="code" className="una-input-label">
              Código de acceso
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="una-input"
              placeholder="XXXX-XXXX"
              style={{
                fontSize: "22px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                color: "var(--sage)",
                letterSpacing: "0.05em",
              }}
            >
              Enviado a tu correo al ser aprobada tu aplicación.
            </p>
          </div>

          {error && (
            <p
              style={{
                margin: "0 0 20px",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "var(--error)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="una-btn"
            style={{ width: "100%" }}
          >
            {loading ? "Verificando…" : "Continuar al pago"}
          </button>
        </form>

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

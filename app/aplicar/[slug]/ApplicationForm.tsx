"use client";

import { useState } from "react";
import type { Retreat } from "@/lib/supabase/types";

interface Props {
  retreat: Retreat;
}

export default function ApplicationForm({ retreat }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    profession: "",
    why_attend: "",
    how_heard: "",
    social_media: "",
    num_attendees: "1",
  });

  function set(field: string) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          retreat_id: retreat.id,
          num_attendees: Math.max(1, Number(form.num_attendees) || 1),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al enviar tu aplicación.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const dateLabel =
    retreat.start_date
      ? new Date(retreat.start_date).toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        })
      : null;

  if (submitted) {
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
        <div style={{ maxWidth: "480px", textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "var(--sage)",
              margin: "0 auto 32px",
              opacity: 0.6,
            }}
          />
          <h1
            style={{
              margin: "0 0 20px",
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "32px",
              color: "var(--olive)",
              lineHeight: 1.2,
            }}
          >
            Gracias, {form.name.split(" ")[0]}.
          </h1>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-serif)",
              fontSize: "19px",
              color: "var(--ink-soft)",
              lineHeight: 1.55,
            }}
          >
            Tu aplicación para <em>{retreat.name}</em> ha sido recibida.
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: "17px",
              color: "var(--sage)",
              lineHeight: 1.55,
            }}
          >
            Nos pondremos en contacto contigo por correo en los próximos días
            para informarte sobre el resultado.
          </p>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "var(--sage)",
              margin: "32px auto 0",
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cream-warm)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--sage-muted)",
          padding: "22px clamp(24px, 5vw, 64px)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--sage)",
          }}
        >
          ÚNA · una.eco
        </p>
      </header>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "clamp(40px,6vh,72px) clamp(24px,5vw,48px) 80px",
        }}
      >
        {/* Retreat info */}
        <div style={{ marginBottom: "48px" }}>
          {dateLabel && (
            <p
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--sage)",
              }}
            >
              {dateLabel}
            </p>
          )}
          <h1
            style={{
              margin: "0 0 14px",
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "clamp(28px, 4vw, 40px)",
              color: "var(--olive)",
              lineHeight: 1.15,
            }}
          >
            {retreat.name}
          </h1>
          {retreat.description && (
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: "19px",
                color: "var(--ink-soft)",
                lineHeight: 1.55,
              }}
            >
              {retreat.description}
            </p>
          )}
        </div>

        <div
          style={{
            width: "40px",
            height: "1px",
            background: "var(--sage)",
            marginBottom: "40px",
            opacity: 0.6,
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <p
            style={{
              margin: "0 0 36px",
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--sage)",
            }}
          >
            Formulario de aplicación
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="una-input-label">
                Nombre completo *
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={set("name")}
                className="una-input"
                placeholder="Tu nombre"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="una-input-label">
                Correo electrónico *
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                className="una-input"
                placeholder="tu@correo.com"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="una-input-label">
                País
              </label>
              <input
                id="country"
                type="text"
                value={form.country}
                onChange={set("country")}
                className="una-input"
                placeholder="¿Desde dónde escribes?"
              />
            </div>

            {/* Profession */}
            <div>
              <label htmlFor="profession" className="una-input-label">
                Profesión / oficio
              </label>
              <input
                id="profession"
                type="text"
                value={form.profession}
                onChange={set("profession")}
                className="una-input"
                placeholder="¿A qué te dedicas?"
              />
            </div>

            {/* Why attend */}
            <div>
              <label htmlFor="why_attend" className="una-input-label">
                ¿Por qué quieres asistir?
              </label>
              <textarea
                id="why_attend"
                rows={4}
                value={form.why_attend}
                onChange={set("why_attend")}
                className="una-input"
                placeholder="Cuéntanos un poco sobre ti y lo que te lleva a querer participar…"
                style={{ resize: "vertical" }}
              />
            </div>

            {/* How heard */}
            <div>
              <label htmlFor="how_heard" className="una-input-label">
                ¿Cómo nos conociste?
              </label>
              <select
                id="how_heard"
                value={form.how_heard}
                onChange={set("how_heard")}
                className="una-input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Selecciona una opción</option>
                <option value="instagram">Instagram</option>
                <option value="referido">Un amigo o conocido</option>
                <option value="boca-a-boca">Boca a boca</option>
                <option value="evento">En un evento</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Social media */}
            <div>
              <label htmlFor="social_media" className="una-input-label">
                Instagram u otra red social (opcional)
              </label>
              <input
                id="social_media"
                type="text"
                value={form.social_media}
                onChange={set("social_media")}
                className="una-input"
                placeholder="@usuario"
              />
            </div>

            {/* Num attendees */}
            <div>
              <label htmlFor="num_attendees" className="una-input-label">
                ¿Cuántas personas vendrán contigo?
              </label>
              <input
                id="num_attendees"
                type="number"
                min={1}
                step={1}
                value={form.num_attendees}
                onChange={set("num_attendees")}
                className="una-input"
              />
            </div>
          </div>

          {error && (
            <p
              style={{
                margin: "24px 0 0",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "var(--error)",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ marginTop: "40px" }}>
            <button type="submit" disabled={loading} className="una-btn">
              {loading ? "Enviando…" : "Enviar aplicación"}
              {!loading && (
                <svg
                  viewBox="0 0 30 10"
                  aria-hidden="true"
                  style={{ width: "30px" }}
                >
                  <path
                    d="M0 5h27M22 1l5 4-5 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

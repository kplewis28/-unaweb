"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/lib/supabase/types";

interface ActionResult {
  applicationId: string;
  type: "success" | "error" | "email-failed";
  message: string;
  code?: string;
}

interface Props {
  applications: Application[];
  userEmail: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "badge badge-pending",
  approved: "badge badge-approved",
  rejected: "badge badge-rejected",
};

export default function DashboardClient({ applications, userEmail }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults((prev) => ({
          ...prev,
          [id]: { applicationId: id, type: "error", message: data.error ?? "Error inesperado" },
        }));
      } else if (action === "approve") {
        if (data.emailSent === false) {
          setResults((prev) => ({
            ...prev,
            [id]: {
              applicationId: id,
              type: "email-failed",
              message: `Código generado para ${data.name}, pero el correo no se pudo enviar. Código: ${data.accessCode}`,
              code: data.accessCode,
            },
          }));
        } else {
          setResults((prev) => ({
            ...prev,
            [id]: {
              applicationId: id,
              type: "success",
              message: `Código generado y correo enviado a ${data.name}`,
            },
          }));
        }
      } else {
        setResults((prev) => ({
          ...prev,
          [id]: {
            applicationId: id,
            type: "success",
            message: `Aplicación de ${data.name} rechazada.`,
          },
        }));
      }

      router.refresh();
    } catch {
      setResults((prev) => ({
        ...prev,
        [id]: { applicationId: id, type: "error", message: "No se pudo conectar con el servidor." },
      }));
    } finally {
      setLoadingId(null);
    }
  }

  const filtered = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-warm)" }}>
      {/* Top nav */}
      <header
        style={{
          borderBottom: "1px solid var(--sage-muted)",
          background: "var(--cream-warm)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "18px clamp(20px, 4vw, 48px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--sage)",
              }}
            >
              ÚNA
            </span>
            <span
              style={{
                marginLeft: "14px",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                opacity: 0.5,
              }}
            >
              Panel administrativo
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "var(--sage)",
                display: "none",
              }}
              className="hidden sm:inline"
            >
              {userEmail}
            </span>
            <button onClick={handleLogout} className="una-btn-ghost">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px clamp(20px, 4vw, 48px) 80px",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: "clamp(28px, 3vw, 40px)",
              color: "var(--olive)",
            }}
          >
            Aplicaciones
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: "var(--sage)",
              letterSpacing: "0.05em",
            }}
          >
            {counts.all} aplicaciones · {counts.pending} pendientes
          </p>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "32px",
            borderBottom: "1px solid var(--sage-muted)",
          }}
        >
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: filter === tab ? "2px solid var(--olive)" : "2px solid transparent",
                marginBottom: "-1px",
                padding: "10px 20px",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: filter === tab ? "var(--olive)" : "var(--sage)",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {tab === "all" ? "Todas" : STATUS_LABELS[tab]}{" "}
              <span style={{ opacity: 0.6 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Applications list */}
        {filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              color: "var(--sage)",
              padding: "60px 0",
            }}
          >
            No hay aplicaciones en esta categoría.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {filtered.map((app) => {
              const result = results[app.id];
              const isLoading = loadingId === app.id;

              return (
                <div
                  key={app.id}
                  style={{
                    background: "var(--cream)",
                    padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 3vw, 32px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                        <h2
                          style={{
                            margin: 0,
                            fontFamily: "var(--font-serif)",
                            fontWeight: 400,
                            fontSize: "22px",
                            color: "var(--olive)",
                          }}
                        >
                          {app.name}
                        </h2>
                        <span className={STATUS_CLASSES[app.status]}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {app.email}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-sans)",
                          fontSize: "11px",
                          color: "var(--sage)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {app.retreat?.name ?? "Retiro"} ·{" "}
                        {app.country ?? "—"} · {app.profession ?? "—"} ·{" "}
                        {new Date(app.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    {app.status === "pending" && (
                      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                        <button
                          disabled={isLoading}
                          onClick={() => handleAction(app.id, "approve")}
                          className="una-btn-ghost"
                          style={{ color: "var(--success)", borderColor: "rgba(58,107,58,0.35)" }}
                        >
                          {isLoading ? "…" : "Aprobar"}
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => handleAction(app.id, "reject")}
                          className="una-btn-danger"
                        >
                          {isLoading ? "…" : "Rechazar"}
                        </button>
                      </div>
                    )}

                    {app.status === "approved" && app.access_code && (
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontFamily: "var(--font-sans)",
                            fontSize: "9px",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "var(--sage)",
                          }}
                        >
                          Código
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "var(--font-sans)",
                            fontSize: "16px",
                            letterSpacing: "0.15em",
                            color: "var(--olive)",
                          }}
                        >
                          {app.access_code}
                        </p>
                        {!app.access_code_email_sent && (
                          <p style={{ margin: "4px 0 0", fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--error)" }}>
                            Email no enviado
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expandable details */}
                  {app.why_attend && (
                    <div
                      style={{
                        borderTop: "1px solid var(--sage-muted)",
                        paddingTop: "12px",
                        marginTop: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontFamily: "var(--font-sans)",
                          fontSize: "9px",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "var(--sage)",
                        }}
                      >
                        Por qué quiere asistir
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-serif)",
                          fontSize: "17px",
                          color: "var(--ink-soft)",
                          lineHeight: 1.5,
                          maxWidth: "680px",
                        }}
                      >
                        {app.why_attend}
                      </p>
                    </div>
                  )}

                  {/* Action result feedback */}
                  {result && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 16px",
                        background:
                          result.type === "error"
                            ? "rgba(139,58,42,0.08)"
                            : result.type === "email-failed"
                            ? "rgba(171,170,112,0.15)"
                            : "rgba(58,107,58,0.08)",
                        borderLeft: `3px solid ${
                          result.type === "error"
                            ? "var(--error)"
                            : result.type === "email-failed"
                            ? "var(--sage)"
                            : "var(--success)"
                        }`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          color:
                            result.type === "error"
                              ? "var(--error)"
                              : result.type === "email-failed"
                              ? "#6b6730"
                              : "var(--success)",
                        }}
                      >
                        {result.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

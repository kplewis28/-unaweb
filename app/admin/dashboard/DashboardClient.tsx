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
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "badge badge-pending",
  approved: "badge badge-approved",
  rejected: "badge badge-rejected",
};

const HOW_HEARD_LABELS: Record<string, string> = {
  instagram: "Instagram",
  referido: "A friend or acquaintance",
  "boca-a-boca": "Word of mouth",
  evento: "At an event",
  otro: "Other",
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "9px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: "var(--sage)",
  display: "block",
  marginBottom: "4px",
};

const value: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "17px",
  color: "var(--ink-soft)",
  lineHeight: 1.5,
};

export default function DashboardClient({ applications, userEmail }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleLogout() {
    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

    if (isMock) {
      await fetch("/api/admin/logout", { method: "POST" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
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
          [id]: { applicationId: id, type: "error", message: data.error ?? "Unexpected error" },
        }));
      } else if (action === "approve") {
        if (data.emailSent === false) {
          setResults((prev) => ({
            ...prev,
            [id]: {
              applicationId: id,
              type: "email-failed",
              message: `Code generated for ${data.name}, but the email could not be sent. Code: ${data.accessCode}`,
              code: data.accessCode,
            },
          }));
        } else {
          setResults((prev) => ({
            ...prev,
            [id]: {
              applicationId: id,
              type: "success",
              message: `Code generated and email sent to ${data.name}`,
            },
          }));
        }
      } else {
        setResults((prev) => ({
          ...prev,
          [id]: {
            applicationId: id,
            type: "success",
            message: `Application from ${data.name} rejected.`,
          },
        }));
      }

      router.refresh();
    } catch {
      setResults((prev) => ({
        ...prev,
        [id]: { applicationId: id, type: "error", message: "Could not connect to the server." },
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

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--sage-muted)",
        background: "var(--cream-warm)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          padding: "18px clamp(20px, 4vw, 48px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: "10px",
              letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)",
            }}>ÚNA</span>
            <span style={{
              width: "1px", height: "14px", background: "var(--sage-muted)",
            }} />
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: "10px",
              letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--sage)",
              opacity: 0.6,
            }}>Admin Panel</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--sage)", opacity: 0.7,
            }}>{userEmail}</span>
            <button onClick={handleLogout} className="una-btn-ghost">Sign out</button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "48px clamp(20px, 4vw, 48px) 100px",
      }}>

        {/* Title + stats */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-serif)", fontWeight: 400,
            fontSize: "clamp(30px, 3vw, 42px)", color: "var(--olive)",
          }}>
            Applications
          </h1>
          <p style={{
            margin: 0, fontFamily: "var(--font-sans)", fontSize: "11px",
            letterSpacing: "0.08em", color: "var(--sage)",
          }}>
            {counts.all} total · {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: "32px",
          borderBottom: "1px solid var(--sage-muted)",
        }}>
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                background: "transparent", border: "none",
                borderBottom: filter === tab ? "2px solid var(--olive)" : "2px solid transparent",
                marginBottom: "-1px",
                padding: "10px 22px",
                fontFamily: "var(--font-sans)", fontSize: "10px",
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: filter === tab ? "var(--olive)" : "var(--sage)",
                cursor: "pointer", transition: "color 0.2s",
              }}
            >
              {tab === "all" ? "All" : STATUS_LABELS[tab]}
              {" "}<span style={{ opacity: 0.55 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Applications list */}
        {filtered.length === 0 ? (
          <p style={{
            textAlign: "center", fontFamily: "var(--font-serif)",
            fontSize: "20px", color: "var(--sage)", padding: "80px 0",
          }}>
            No applications in this category.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {filtered.map((app) => {
              const result = results[app.id];
              const isLoading = loadingId === app.id;
              const isExpanded = expanded[app.id];
              const expiresAt = app.access_code_expires_at
                ? new Date(app.access_code_expires_at).toLocaleDateString("es-ES", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : null;

              return (
                <div key={app.id} style={{ background: "var(--cream)" }}>

                  {/* Card header */}
                  <div style={{
                    padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 3vw, 32px)",
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
                  }}>

                    {/* Left: identity + meta */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <h2 style={{
                          margin: 0, fontFamily: "var(--font-serif)",
                          fontWeight: 400, fontSize: "22px", color: "var(--olive)",
                        }}>
                          {app.name}
                        </h2>
                        <span className={STATUS_CLASSES[app.status]}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </div>
                      <p style={{
                        margin: "0 0 3px", fontFamily: "var(--font-sans)",
                        fontSize: "12px", color: "var(--ink-soft)",
                      }}>
                        {app.email}
                      </p>
                      <p style={{
                        margin: 0, fontFamily: "var(--font-sans)",
                        fontSize: "11px", color: "var(--sage)", letterSpacing: "0.04em",
                      }}>
                        {[app.country, app.profession].filter(Boolean).join(" · ")}
                        {" · "}
                        {new Date(app.created_at).toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Right: actions or code */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", flexShrink: 0 }}>
                      {app.status === "pending" && (
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            disabled={isLoading}
                            onClick={() => handleAction(app.id, "approve")}
                            className="una-btn-ghost"
                            style={{ color: "var(--success)", borderColor: "rgba(58,107,58,0.35)" }}
                          >
                            {isLoading ? "…" : "Approve"}
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => handleAction(app.id, "reject")}
                            className="una-btn-danger"
                          >
                            {isLoading ? "…" : "Reject"}
                          </button>
                        </div>
                      )}

                      {app.status === "approved" && app.access_code && (
                        <div style={{ textAlign: "right" }}>
                          <p style={{
                            margin: "0 0 2px", fontFamily: "var(--font-sans)",
                            fontSize: "9px", letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "var(--sage)",
                          }}>Access code</p>
                          <p style={{
                            margin: "0 0 2px", fontFamily: "var(--font-sans)",
                            fontSize: "18px", letterSpacing: "0.18em", color: "var(--olive)",
                          }}>
                            {app.access_code}
                          </p>
                          {expiresAt && (
                            <p style={{
                              margin: 0, fontFamily: "var(--font-sans)",
                              fontSize: "10px", color: "var(--sage)", opacity: 0.7,
                            }}>
                              Expires {expiresAt}
                            </p>
                          )}
                          {!app.access_code_email_sent && (
                            <p style={{
                              margin: "4px 0 0", fontFamily: "var(--font-sans)",
                              fontSize: "10px", color: "var(--error)",
                            }}>
                              Email not sent
                            </p>
                          )}
                        </div>
                      )}

                      {/* Toggle details */}
                      <button
                        onClick={() => toggleExpand(app.id)}
                        style={{
                          background: "transparent", border: "none", padding: 0,
                          fontFamily: "var(--font-sans)", fontSize: "10px",
                          letterSpacing: "0.2em", textTransform: "uppercase",
                          color: "var(--sage)", cursor: "pointer",
                          textDecoration: "underline", textUnderlineOffset: "3px",
                          opacity: 0.75, transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
                      >
                        {isExpanded ? "Hide" : "View application"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid var(--sage-muted)",
                      padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 3vw, 32px)",
                      display: "flex", flexDirection: "column", gap: "28px",
                    }}>

                      {/* Why attend */}
                      {app.why_attend && (
                        <div>
                          <span style={label}>Why do they want to attend?</span>
                          <p style={{ ...value, maxWidth: "680px" }}>{app.why_attend}</p>
                        </div>
                      )}

                      {/* Secondary fields row */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
                        {app.how_heard && (
                          <div>
                            <span style={label}>How did they hear about us?</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {HOW_HEARD_LABELS[app.how_heard] ?? app.how_heard}
                            </p>
                          </div>
                        )}
                        {app.social_media && (
                          <div>
                            <span style={label}>Social media</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {app.social_media}
                            </p>
                          </div>
                        )}
                        {app.retreat && (
                          <div>
                            <span style={label}>Retreat</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {app.retreat.name}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {app.notes && (
                        <div>
                          <span style={label}>Internal notes</span>
                          <p style={{ ...value, fontSize: "15px", maxWidth: "680px", margin: 0 }}>
                            {app.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action result feedback */}
                  {result && (
                    <div style={{
                      borderTop: "1px solid var(--sage-muted)",
                      padding: "12px clamp(20px, 3vw, 32px)",
                      background: result.type === "error"
                        ? "rgba(139,58,42,0.06)"
                        : result.type === "email-failed"
                        ? "rgba(171,170,112,0.12)"
                        : "rgba(58,107,58,0.06)",
                      borderLeft: `3px solid ${
                        result.type === "error" ? "var(--error)"
                        : result.type === "email-failed" ? "var(--sage)"
                        : "var(--success)"
                      }`,
                    }}>
                      <p style={{
                        margin: 0, fontFamily: "var(--font-sans)", fontSize: "12px",
                        color: result.type === "error" ? "var(--error)"
                          : result.type === "email-failed" ? "#6b6730"
                          : "var(--success)",
                      }}>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application, ContactMessage } from "@/lib/supabase/types";
import AdminNav from "../AdminNav";

interface ActionResult {
  applicationId: string;
  type: "success" | "error" | "email-failed";
  message: string;
  code?: string;
}

const RESULT_STYLES: Record<ActionResult["type"], { bg: string; border: string; color: string }> = {
  success: { bg: "rgba(58,107,58,0.06)", border: "rgba(58,107,58,0.25)", color: "var(--success)" },
  error: { bg: "rgba(139,58,42,0.06)", border: "rgba(139,58,42,0.25)", color: "var(--error)" },
  "email-failed": { bg: "rgba(171,170,112,0.14)", border: "rgba(171,170,112,0.4)", color: "#6b6730" },
};

function ResultIcon({ type }: { type: ActionResult["type"] }) {
  const color = RESULT_STYLES[type].color;
  if (type === "error") {
    return (
      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="7.5" cy="7.5" r="6.5" stroke={color} strokeWidth="1.2" />
        <path d="M5.5 5.5L9.5 9.5M9.5 5.5L5.5 9.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "email-failed") {
    return (
      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
        <path d="M7.5 1.3L14 13H1L7.5 1.3Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M7.5 6V8.7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7.5" cy="10.7" r="0.65" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="6.5" stroke={color} strokeWidth="1.2" />
      <path d="M4.6 7.6L6.4 9.4L10.4 5.4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateField({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label htmlFor={id} className="una-input-label">{label}</label>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "var(--cream)", border: "1px solid var(--sage-muted)",
        borderRadius: "8px", padding: "9px 12px",
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="var(--sage)" strokeWidth="1.1" />
          <path d="M1.5 6.3H14.5" stroke="var(--sage)" strokeWidth="1.1" />
          <path d="M4.5 1V3.6M11.5 1V3.6" stroke="var(--sage)" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "12px",
            color: "var(--ink-soft)", background: "transparent", border: "none",
            padding: 0, outline: "none",
          }}
        />
      </div>
    </div>
  );
}

function SearchInput({
  value, onChange, placeholder,
}: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      background: "var(--cream)", border: "1px solid var(--sage-muted)",
      borderRadius: "8px", padding: "11px 14px", maxWidth: "360px",
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
        <circle cx="6.8" cy="6.8" r="5" stroke="var(--sage)" strokeWidth="1.2" />
        <path d="M10.6 10.6L14.5 14.5" stroke="var(--sage)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none",
          fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--ink-soft)",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            border: "none", background: "transparent", cursor: "pointer", padding: 0,
            color: "var(--sage)", display: "flex", alignItems: "center", flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M3.5 3.5L11.5 11.5M11.5 3.5L3.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function DateRangeFilter({
  idPrefix, dateFrom, dateTo, onChange,
}: {
  idPrefix: string; dateFrom: string; dateTo: string;
  onChange: (from: string, to: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const today = todayISO();

  const presets = [
    { key: "all", label: "All time", from: "", to: "" },
    { key: "today", label: "Today", from: today, to: today },
    { key: "7d", label: "Last 7 days", from: daysAgoISO(6), to: today },
    { key: "30d", label: "Last 30 days", from: daysAgoISO(29), to: today },
  ];
  const activePreset = presets.find((p) => p.from === dateFrom && p.to === dateTo);
  const isCustom = !activePreset && Boolean(dateFrom || dateTo);

  function chipStyle(active: boolean): React.CSSProperties {
    return {
      padding: "8px 16px", borderRadius: "20px", cursor: "pointer",
      fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.16em",
      textTransform: "uppercase", whiteSpace: "nowrap",
      border: active ? "1px solid var(--olive)" : "1px solid var(--sage-muted)",
      background: active ? "var(--olive)" : "transparent",
      color: active ? "var(--cream)" : "var(--sage)",
      transition: "background 0.2s, color 0.2s, border-color 0.2s",
    };
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => { onChange(p.from, p.to); setCustomOpen(false); }}
            style={chipStyle(!isCustom && activePreset?.key === p.key)}
          >
            {p.label}
          </button>
        ))}
        <button onClick={() => setCustomOpen((v) => !v)} style={chipStyle(isCustom || customOpen)}>
          Custom range
        </button>
      </div>
      {(customOpen || isCustom) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "14px" }}>
          <DateField
            id={`${idPrefix}-from`} label="From" value={dateFrom}
            onChange={(v) => onChange(v, dateTo)}
          />
          <DateField
            id={`${idPrefix}-to`} label="To" value={dateTo}
            onChange={(v) => onChange(dateFrom, v)}
          />
        </div>
      )}
    </div>
  );
}

interface Props {
  applications: Application[];
  messages: ContactMessage[];
  userEmail: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "badge badge-pending",
  approved: "badge badge-approved",
  rejected: "badge badge-rejected",
  paid: "badge badge-paid",
};

const HOW_HEARD_LABELS: Record<string, string> = {
  instagram: "Instagram",
  referido: "A friend or acquaintance",
  "boca-a-boca": "Word of mouth",
  evento: "At an event",
  otro: "Other",
};

const ORG_CONNECTION_LABELS: Record<string, string> = {
  yes: "Yes",
  potentially: "Potentially",
  "not-at-this-time": "Not at this time",
};

const TRAVEL_AVAILABILITY_LABELS: Record<string, string> = {
  yes: "Yes",
  "need-details": "I need further details",
};

const INVESTMENT_COMFORT_LABELS: Record<string, string> = {
  accessible: "This investment feels accessible to me.",
  discuss: "I'd like to discuss payment plans or financial support.",
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
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

export default function DashboardClient({ applications, messages, userEmail }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"applications" | "messages">("applications");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "paid">("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [msgDateFrom, setMsgDateFrom] = useState("");
  const [msgDateTo, setMsgDateTo] = useState("");
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

  async function handleAction(id: string, action: "approve" | "reject" | "cancel") {
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
      } else if (action === "cancel") {
        setResults((prev) => ({
          ...prev,
          [id]: {
            applicationId: id,
            type: "success",
            message: `Approval cancelled for ${data.name}. Their access code was expired and the application moved back to pending.`,
          },
        }));
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

  const searchTerm = search.trim().toLowerCase();
  const msgSearchTerm = msgSearch.trim().toLowerCase();

  const filtered = applications
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => !dateFrom || a.created_at >= dateFrom)
    .filter((a) => !dateTo || a.created_at <= `${dateTo}T23:59:59.999Z`)
    .filter((a) => !searchTerm || [a.name, a.email, a.country, a.profession]
      .filter(Boolean).some((field) => field!.toLowerCase().includes(searchTerm)));

  const filteredMessages = messages
    .filter((m) => !msgDateFrom || m.created_at >= msgDateFrom)
    .filter((m) => !msgDateTo || m.created_at <= `${msgDateTo}T23:59:59.999Z`)
    .filter((m) => !msgSearchTerm || [m.name, m.email, m.interest, m.message]
      .filter(Boolean).some((field) => field!.toLowerCase().includes(msgSearchTerm)));

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    paid: applications.filter((a) => a.status === "paid").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-warm)" }}>

      {/* Header */}
      <AdminNav
        right={
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", rowGap: "8px" }}>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--cream)", opacity: 0.7,
              maxWidth: "45vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{userEmail}</span>
            <button onClick={handleLogout} className="una-btn-ghost-dark">Sign out</button>
          </div>
        }
      />

      <main style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "48px clamp(20px, 4vw, 48px) 100px",
      }}>

        {/* View switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          <button
            onClick={() => setView("applications")}
            className={view === "applications" ? "una-btn" : "una-btn-ghost"}
          >
            Applications
          </button>
          <button
            onClick={() => setView("messages")}
            className={view === "messages" ? "una-btn" : "una-btn-ghost"}
          >
            Messages {messages.length > 0 && `(${messages.length})`}
          </button>
        </div>

        {view === "applications" && (
        <>
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
            {counts.all} total · {counts.pending} pending · {counts.approved} approved · {counts.paid} paid · {counts.rejected} rejected
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, country, profession…" />
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: "20px",
          borderBottom: "1px solid var(--sage-muted)",
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          {(["all", "pending", "approved", "paid", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                background: "transparent", border: "none",
                borderBottom: filter === tab ? "2px solid var(--olive)" : "2px solid transparent",
                marginBottom: "-1px",
                padding: "10px 22px",
                whiteSpace: "nowrap", flexShrink: 0,
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

        {/* Date filter */}
        <DateRangeFilter
          idPrefix="date" dateFrom={dateFrom} dateTo={dateTo}
          onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />

        {/* Applications list */}
        {filtered.length === 0 ? (
          <p style={{
            textAlign: "center", fontFamily: "var(--font-serif)",
            fontSize: "20px", color: "var(--sage)", padding: "80px 0",
          }}>
            No applications in this category.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                <div key={app.id} className="una-card" style={{ background: "var(--cream)", border: "1px solid var(--sage-muted)" }}>

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
                          <button
                            disabled={isLoading}
                            onClick={() => handleAction(app.id, "cancel")}
                            className="una-btn-danger"
                            style={{ marginTop: "10px" }}
                          >
                            {isLoading ? "…" : "Cancel approval"}
                          </button>
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

                      {/* Legacy "why attend" answer, kept for applications submitted before the form update */}
                      {app.why_attend && (
                        <div>
                          <span style={label}>Why do they want to attend?</span>
                          <p style={{ ...value, maxWidth: "680px" }}>{app.why_attend}</p>
                        </div>
                      )}

                      {/* Open-ended questions */}
                      {app.q_draw && (
                        <div>
                          <span style={label}>What draws them to this gathering right now?</span>
                          <p style={{ ...value, maxWidth: "680px" }}>{app.q_draw}</p>
                        </div>
                      )}
                      {app.q_work_intersection && (
                        <div>
                          <span style={label}>How does their work intersect with Indigenous knowledge, climate, culture, or systems change?</span>
                          <p style={{ ...value, maxWidth: "680px" }}>{app.q_work_intersection}</p>
                        </div>
                      )}
                      {app.q_responsible_participation && (
                        <div>
                          <span style={label}>What does responsible participation mean to them?</span>
                          <p style={{ ...value, maxWidth: "680px" }}>{app.q_responsible_participation}</p>
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
                            <span style={label}>LinkedIn / Website</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {app.social_media}
                            </p>
                          </div>
                        )}
                        {app.phone && (
                          <div>
                            <span style={label}>Mobile / WhatsApp</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {app.phone}
                            </p>
                          </div>
                        )}
                        {app.org_connection && (
                          <div>
                            <span style={label}>Connected to an org/foundation/brand?</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {ORG_CONNECTION_LABELS[app.org_connection] ?? app.org_connection}
                            </p>
                          </div>
                        )}
                        {app.travel_availability && (
                          <div>
                            <span style={label}>Available to travel for the gathering dates?</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {TRAVEL_AVAILABILITY_LABELS[app.travel_availability] ?? app.travel_availability}
                            </p>
                          </div>
                        )}
                        {app.investment_comfort && (
                          <div>
                            <span style={label}>Investment</span>
                            <p style={{ ...value, fontSize: "15px", margin: 0 }}>
                              {INVESTMENT_COMFORT_LABELS[app.investment_comfort] ?? app.investment_comfort}
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
                      padding: "14px clamp(20px, 3vw, 32px)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      background: RESULT_STYLES[result.type].bg,
                    }}>
                      <span style={{ marginTop: "2px" }}>
                        <ResultIcon type={result.type} />
                      </span>
                      <p style={{
                        margin: 0, fontFamily: "var(--font-sans)", fontSize: "12px",
                        letterSpacing: "0.01em", lineHeight: 1.55,
                        color: RESULT_STYLES[result.type].color,
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
        </>
        )}

        {view === "messages" && (
        <>
        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-serif)", fontWeight: 400,
            fontSize: "clamp(30px, 3vw, 42px)", color: "var(--olive)",
          }}>
            Contact messages
          </h1>
          <p style={{
            margin: 0, fontFamily: "var(--font-sans)", fontSize: "11px",
            letterSpacing: "0.08em", color: "var(--sage)",
          }}>
            {messages.length} total
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px" }}>
          <SearchInput value={msgSearch} onChange={setMsgSearch} placeholder="Search by name, email, message…" />
        </div>

        {/* Date filter */}
        <DateRangeFilter
          idPrefix="msg-date" dateFrom={msgDateFrom} dateTo={msgDateTo}
          onChange={(from, to) => { setMsgDateFrom(from); setMsgDateTo(to); }}
        />

        {/* Messages list */}
        {filteredMessages.length === 0 ? (
          <p style={{
            textAlign: "center", fontFamily: "var(--font-serif)",
            fontSize: "20px", color: "var(--sage)", padding: "80px 0",
          }}>
            No contact messages{messages.length === 0 ? " yet" : " in this range"}.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="una-card" style={{
                background: "var(--cream)", border: "1px solid var(--sage-muted)",
                padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 3vw, 32px)",
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
                  marginBottom: "12px",
                }}>
                  <div>
                    <h2 style={{
                      margin: "0 0 3px", fontFamily: "var(--font-serif)",
                      fontWeight: 400, fontSize: "20px", color: "var(--olive)",
                    }}>
                      {msg.name}
                    </h2>
                    <p style={{
                      margin: 0, fontFamily: "var(--font-sans)",
                      fontSize: "12px", color: "var(--ink-soft)",
                    }}>
                      {msg.email}
                    </p>
                  </div>
                  <p style={{
                    margin: 0, fontFamily: "var(--font-sans)", fontSize: "11px",
                    color: "var(--sage)", letterSpacing: "0.04em", whiteSpace: "nowrap",
                  }}>
                    {new Date(msg.created_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>

                {msg.interest && (
                  <div style={{ marginBottom: "10px" }}>
                    <span style={label}>Writing about</span>
                    <p style={{ ...value, fontSize: "15px", margin: 0 }}>{msg.interest}</p>
                  </div>
                )}

                {msg.message && (
                  <div>
                    <span style={label}>Message</span>
                    <p style={{ ...value, maxWidth: "680px" }}>{msg.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}

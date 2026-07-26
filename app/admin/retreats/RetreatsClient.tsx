"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Retreat } from "@/lib/supabase/types";
import AdminNav from "../AdminNav";

interface Props {
  retreats: Retreat[];
  applicationCounts: Record<string, number>;
  userEmail: string;
}

interface RetreatFormValues {
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  total_spots: string;
  price_usd: string;
  currency: string;
  is_open: boolean;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

function toFormValues(retreat?: Retreat | null): RetreatFormValues {
  return {
    name: retreat?.name ?? "",
    description: retreat?.description ?? "",
    location: retreat?.location ?? "",
    start_date: retreat?.start_date ?? "",
    end_date: retreat?.end_date ?? "",
    total_spots: retreat ? String(retreat.total_spots) : "",
    price_usd: retreat ? String(retreat.price_cents / 100) : "",
    currency: retreat?.currency ?? "USD",
    is_open: retreat?.is_open ?? true,
  };
}

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "9px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--sage)",
  display: "block",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-sans)",
  fontSize: "13px",
  color: "var(--ink-soft)",
  background: "var(--cream-warm)",
  border: "1px solid var(--sage-muted)",
  borderRadius: "8px",
  padding: "9px 12px",
  outline: "none",
  boxSizing: "border-box" as const,
};

function RetreatForm({
  initial,
  onCancel,
  onSaved,
  submit,
}: {
  initial?: Retreat | null;
  onCancel: () => void;
  onSaved: () => void;
  submit: (values: RetreatFormValues) => Promise<ActionResult>;
}) {
  const [values, setValues] = useState<RetreatFormValues>(toFormValues(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RetreatFormValues>(key: K, value: RetreatFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await submit(values);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Error inesperado.");
      return;
    }
    onSaved();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="una-card"
      style={{
        background: "var(--cream)",
        border: "1px solid var(--sage-muted)",
        padding: "clamp(20px, 2.5vw, 28px)",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div>
        <label style={fieldLabel}>Name</label>
        <input required style={inputStyle} value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label style={fieldLabel}>Description</label>
        <textarea
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <label style={fieldLabel}>Location</label>
        <input style={inputStyle} value={values.location} onChange={(e) => set("location", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <label style={fieldLabel}>Start date</label>
          <input
            required
            type="date"
            style={inputStyle}
            value={values.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <label style={fieldLabel}>End date</label>
          <input
            required
            type="date"
            style={inputStyle}
            value={values.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <label style={fieldLabel}>Total spots</label>
          <input
            required
            type="number"
            min="1"
            step="1"
            style={inputStyle}
            value={values.total_spots}
            onChange={(e) => set("total_spots", e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <label style={fieldLabel}>Price (USD)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            style={inputStyle}
            value={values.price_usd}
            onChange={(e) => set("price_usd", e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: "100px" }}>
          <label style={fieldLabel}>Currency</label>
          <input style={inputStyle} value={values.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
        </div>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--ink-soft)",
        }}
      >
        <input type="checkbox" checked={values.is_open} onChange={(e) => set("is_open", e.target.checked)} />
        Registration open
      </label>

      {error && (
        <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--error)" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="submit" disabled={saving} className="una-btn">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="una-btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function RetreatsClient({ retreats, applicationCounts, userEmail }: Props) {
  const router = useRouter();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleLogout() {
    const isMock =
      !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

    if (isMock) {
      await fetch("/api/admin/logout", { method: "POST" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
  }

  async function createRetreat(values: RetreatFormValues): Promise<ActionResult> {
    const res = await fetch("/api/admin/retreats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.error };
  }

  async function updateRetreat(id: string, values: RetreatFormValues): Promise<ActionResult> {
    const res = await fetch(`/api/admin/retreats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.error };
  }

  async function handleToggleOpen(retreat: Retreat) {
    setTogglingId(retreat.id);
    try {
      const res = await fetch(`/api/admin/retreats/${retreat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: !retreat.is_open }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error ?? "Could not update the status." });
      } else {
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(retreat: Retreat) {
    if (!window.confirm(`Delete "${retreat.name}"? This action cannot be undone.`)) return;
    setDeletingId(retreat.id);
    try {
      const res = await fetch(`/api/admin/retreats/${retreat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error ?? "Could not delete the retreat." });
      } else {
        setFeedback({ type: "success", message: `"${retreat.name}" was deleted.` });
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-warm)" }}>
      <AdminNav
        right={
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", rowGap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "var(--cream)",
                opacity: 0.7,
                maxWidth: "35vw",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </span>
            <span style={{ width: "1px", height: "16px", background: "rgba(171,170,112,0.3)" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <a href="/admin/dashboard" className="una-btn-ghost-dark" style={{ textDecoration: "none" }}>
                Back to dashboard
              </a>
              <button onClick={handleLogout} className="una-btn-ghost-dark">
                Sign out
              </button>
            </div>
          </div>
        }
      />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px clamp(20px, 4vw, 48px) 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 6px",
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                fontSize: "clamp(30px, 3vw, 42px)",
                color: "var(--olive)",
              }}
            >
              Retreats
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "var(--sage)",
              }}
            >
              {retreats.length} total
            </p>
          </div>
          <button
            onClick={() => {
              setShowNewForm((v) => !v);
              setEditingId(null);
            }}
            className="una-btn"
          >
            {showNewForm ? "Cancel" : "New retreat"}
          </button>
        </div>

        {feedback && (
          <p
            style={{
              margin: "0 0 20px",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: feedback.type === "success" ? "var(--success)" : "var(--error)",
            }}
          >
            {feedback.message}
          </p>
        )}

        {showNewForm && (
          <RetreatForm
            submit={createRetreat}
            onCancel={() => setShowNewForm(false)}
            onSaved={() => {
              setShowNewForm(false);
              setFeedback({ type: "success", message: "Retreat created." });
              router.refresh();
            }}
          />
        )}

        {retreats.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              color: "var(--sage)",
              padding: "80px 0",
            }}
          >
            No retreats yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {retreats.map((retreat) => {
              const appCount = applicationCounts[retreat.id] ?? 0;

              if (editingId === retreat.id) {
                return (
                  <RetreatForm
                    key={retreat.id}
                    initial={retreat}
                    submit={(values) => updateRetreat(retreat.id, values)}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      setFeedback({ type: "success", message: "Retreat updated." });
                      router.refresh();
                    }}
                  />
                );
              }

              return (
                <div
                  key={retreat.id}
                  className="una-card"
                  style={{
                    background: "var(--cream)",
                    border: "1px solid var(--sage-muted)",
                    padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 3vw, 32px)",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-serif)",
                          fontWeight: 400,
                          fontSize: "20px",
                          color: "var(--olive)",
                        }}
                      >
                        {retreat.name}
                      </h2>
                      <span className={retreat.is_open ? "badge badge-approved" : "badge badge-rejected"}>
                        {retreat.is_open ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 3px", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--ink-soft)" }}>
                      {retreat.start_date} → {retreat.end_date} · {retreat.location || "No location"}
                    </p>
                    <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--sage)" }}>
                      ${(retreat.price_cents / 100).toLocaleString("en-US")} {retreat.currency} · {retreat.total_spots} spots ·{" "}
                      {appCount} application{appCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => {
                        setEditingId(retreat.id);
                        setShowNewForm(false);
                      }}
                      className="una-btn-ghost"
                    >
                      Edit
                    </button>
                    <button
                      disabled={togglingId === retreat.id}
                      onClick={() => handleToggleOpen(retreat)}
                      className="una-btn-ghost"
                    >
                      {togglingId === retreat.id ? "…" : retreat.is_open ? "Close registration" : "Open registration"}
                    </button>
                    {appCount === 0 && (
                      <button disabled={deletingId === retreat.id} onClick={() => handleDelete(retreat)} className="una-btn-danger">
                        {deletingId === retreat.id ? "…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

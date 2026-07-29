"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://mock.supabase.co";

interface Props {
  userEmail: string;
}

// The nav's one entry point for anything account-related — email, change
// password, sign out — so they stop competing as separate buttons.
export default function AccountMenu({ userEmail }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (IS_MOCK) {
      await fetch("/api/admin/logout", { method: "POST" });
    } else {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="una-btn-ghost-dark"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="5.2" r="2.8" stroke="currentColor" strokeWidth="1.1" />
          <path d="M2.5 14c0-3 2.4-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </span>
        <svg
          width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", opacity: 0.7 }}
        >
          <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
            background: "var(--cream)", border: "1px solid var(--sage-muted)",
            borderRadius: "8px", minWidth: "190px", overflow: "hidden",
            boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
          }}
        >
          <a
            href="/admin/account"
            role="menuitem"
            style={{
              display: "block", padding: "12px 16px", textDecoration: "none",
              fontFamily: "var(--font-sans)", fontSize: "11px", letterSpacing: "0.05em",
              color: "var(--ink-soft)",
            }}
          >
            Account settings
          </a>
          <div style={{ height: "1px", background: "var(--sage-muted)" }} />
          <button
            onClick={handleLogout}
            role="menuitem"
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "12px 16px",
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: "11px", letterSpacing: "0.05em",
              color: "var(--error)",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

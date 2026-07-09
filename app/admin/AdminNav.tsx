import type { ReactNode } from "react";

interface Props {
  right?: ReactNode;
}

export default function AdminNav({ right }: Props) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--olive)",
        borderBottom: "1px solid rgba(171,170,112,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px clamp(20px, 4vw, 48px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" style={{ display: "flex", lineHeight: 0 }} aria-label="Back to una.eco">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/una-logo-wide.png"
              alt="ÚNA"
              style={{ height: "24px", width: "auto", display: "block" }}
            />
          </a>
          <span style={{ width: "1px", height: "16px", background: "rgba(171,170,112,0.3)" }} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--cream)",
              opacity: 0.7,
            }}
          >
            Admin
          </span>
        </div>
        {right}
      </div>
    </header>
  );
}

export default function GraciasPage() {
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
            fontSize: "34px",
            color: "var(--olive)",
            lineHeight: 1.2,
          }}
        >
          Your spot is confirmed.
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
          Thank you for completing your payment. You will receive an email
          with all the retreat details very soon.
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
          See you soon.
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
        <p
          style={{
            marginTop: "32px",
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

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
          Tu lugar está confirmado.
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
          Gracias por completar el pago. Recibirás un correo con todos los
          detalles del retiro muy pronto.
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
          Nos vemos pronto.
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

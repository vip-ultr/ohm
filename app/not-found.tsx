export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>404</h1>
      <p style={{ color: "var(--text3)", margin: 0 }}>Page not found.</p>
      <a href="/" style={{ color: "var(--green)", fontSize: 14 }}>
        Go home
      </a>
    </div>
  );
}

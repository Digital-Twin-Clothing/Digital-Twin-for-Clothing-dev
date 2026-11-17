import { getBuildInfo } from "@/lib/build-info";

// Small bar at the top of the home page that proves which build is live.
export function HelloWorldBanner() {
  const info = getBuildInfo();

  return (
    <div
      data-testid="hello-world-banner"
      style={{
        background: "#eef3f8",
        color: "#1f3a5f",
        borderBottom: "1px solid #c9d6e3",
        fontSize: "14px",
        lineHeight: 1.5,
        padding: "8px 16px",
        textAlign: "center",
      }}
    >
      <strong>{info.greeting}</strong> from {info.startupName}
      {" · "}environment: <strong>{info.environment}</strong>
      {" · "}commit <code title={info.commitSha}>{info.shortSha}</code>
      <span style={{ display: "block", fontSize: "12px", opacity: 0.75 }}>
        Built from commit {info.commitSha}
      </span>
    </div>
  );
}

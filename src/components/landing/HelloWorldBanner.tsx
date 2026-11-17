import { getBuildInfo } from "@/lib/build-info";

// Bar that proves which build is live. The site's menu is fixed to the top of
// the screen, so this bar is pinned to the bottom where nothing covers it.
export function HelloWorldBanner() {
  const info = getBuildInfo();

  return (
    <div
      data-testid="hello-world-banner"
      role="status"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        background: "#eef3f8",
        color: "#1f3a5f",
        borderTop: "1px solid #c9d6e3",
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

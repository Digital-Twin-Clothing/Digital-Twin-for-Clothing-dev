"use client";

import { createElement, useEffect, useState } from "react";

/** Interactive 3D viewer (drag to rotate). Loads the web component only in the browser. */
export function ModelViewer({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer")
      .then(() => !cancelled && setReady(true))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="flex h-[480px] items-center justify-center text-sm text-mute">Loading 3D viewer…</div>;
  }
  return createElement("model-viewer", {
    src,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    style: { width: "100%", height: "480px" },
  });
}

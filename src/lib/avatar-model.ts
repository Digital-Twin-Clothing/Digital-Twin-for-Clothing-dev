/**
 * The 3D-model service (ML worker) and the website share the `AvatarPhotos`
 * record. The website sets `status: "uploaded"` once all four photos are in.
 * The worker then moves it along:
 *
 *   uploaded -> processing -> ready   (and sets `modelPath` to a gs:// URL of body.glb)
 *                          -> failed  (and sets `modelError` to a short reason)
 *
 * Uploading new photos replaces the whole record, so an old model never
 * outlives the photos it was built from.
 */
export type ModelState = "none" | "waiting" | "processing" | "ready" | "failed";

export function modelState(record?: { status?: string; modelPath?: string } | null): ModelState {
  switch (record?.status) {
    case "uploaded":
      return "waiting";
    case "processing":
      return "processing";
    case "ready":
      return record.modelPath ? "ready" : "processing";
    case "failed":
      return "failed";
    default:
      return "none";
  }
}

// Height handling shared by the upload page (browser) and the upload route (server).
// Heights are stored in centimetres, which is what the 3D model scaling needs.

export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;

export type HeightInput =
  | { unit: "cm"; cm: string }
  | { unit: "ftin"; ft: string; inch: string };

const CM_PER_INCH = 2.54;

/** Returns the height in cm (one decimal), or null if it is empty, not a number or out of range. */
export function toCm(input: HeightInput): number | null {
  let cm: number;
  if (input.unit === "cm") {
    if (input.cm.trim() === "") return null;
    cm = Number(input.cm);
  } else {
    if (input.ft.trim() === "") return null;
    const ft = Number(input.ft);
    const inch = input.inch.trim() === "" ? 0 : Number(input.inch);
    if (inch < 0 || inch >= 12) return null;
    cm = (ft * 12 + inch) * CM_PER_INCH;
  }
  return isValidHeightCm(cm) ? Math.round(cm * 10) / 10 : null;
}

export function isValidHeightCm(cm: unknown): cm is number {
  return typeof cm === "number" && Number.isFinite(cm) && cm >= MIN_HEIGHT_CM && cm <= MAX_HEIGHT_CM;
}

/** For display, for example "175 cm (5′ 9″)". */
export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return `${Math.round(cm * 10) / 10} cm (${Math.floor(totalInches / 12)}′ ${totalInches % 12}″)`;
}

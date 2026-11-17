// What the Hello World banner shows. The greeting is the text the
// "greeting-change" pull request edits to prove the pipeline works.
export const GREETING = "Hello again,  World";
export const STARTUP_NAME = "Digital Twin for Clothing";

export type BuildInfo = {
  greeting: string;
  startupName: string;
  environment: string;
  commitSha: string;
  shortSha: string;
};

// COMMIT_SHA is baked into the image by the app pipeline (Dockerfile build arg).
// APP_ENV is set on the Cloud Run service by Terraform (dev).
export function getBuildInfo(env: Record<string, string | undefined> = process.env): BuildInfo {
  const commitSha = env.COMMIT_SHA || "local";
  return {
    greeting: GREETING,
    startupName: STARTUP_NAME,
    environment: env.APP_ENV || "local",
    commitSha,
    shortSha: commitSha.slice(0, 7),
  };
}

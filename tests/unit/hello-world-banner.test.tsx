// @vitest-environment jsdom
// Hello World page for the CI/CD assignment: greeting, startup name,
// environment and the commit SHA the image was built from.
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

import { getBuildInfo, GREETING, STARTUP_NAME } from "@/lib/build-info";
import { HelloWorldBanner } from "@/components/landing/HelloWorldBanner";

const SHA = "0123456789abcdef0123456789abcdef01234567";

afterEach(() => {
  cleanup();
  delete process.env.COMMIT_SHA;
  delete process.env.APP_ENV;
});

describe("getBuildInfo()", () => {
  it("uses COMMIT_SHA and APP_ENV when they are set", () => {
    const info = getBuildInfo({ COMMIT_SHA: SHA, APP_ENV: "dev" });
    expect(info).toEqual({
      greeting: GREETING,
      startupName: STARTUP_NAME,
      environment: "dev",
      commitSha: SHA,
      shortSha: "0123456",
    });
  });

  it("falls back to local when they are missing", () => {
    const info = getBuildInfo({});
    expect(info.environment).toBe("local");
    expect(info.commitSha).toBe("local");
  });
});

describe("HelloWorldBanner", () => {
  it("shows the greeting, startup name, environment and commit SHA", () => {
    process.env.COMMIT_SHA = SHA;
    process.env.APP_ENV = "dev";
    render(<HelloWorldBanner />);
    const banner = screen.getByTestId("hello-world-banner");
    expect(banner.textContent).toContain(GREETING);
    expect(banner.textContent).toContain(STARTUP_NAME);
    expect(banner.textContent).toContain("environment: dev");
    expect(banner.textContent).toContain(SHA);
  });
});

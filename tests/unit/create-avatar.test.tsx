// @vitest-environment jsdom
// S1-UT-10 to S1-UT-12: CreateAvatarPage (src/app/create-avatar/page.tsx)
// Test doubles: authStateStub replaces useAuth(), routerPushSpy replaces useRouter().push,
// alertSpy replaces window.alert, next/link is a plain <a>. FileReader is the real jsdom one.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

const authStateStub = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));
const routerPushSpy = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authStateStub }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPushSpy }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => React.createElement("a", { href, ...rest }, children),
}));

import CreateAvatarPage from "@/app/create-avatar/page";

const TEN_MB = 10 * 1024 * 1024; // 10,485,760 bytes

function photo(name: string, type = "image/jpeg", size?: number) {
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

function slotInputs(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

function createButton() {
  return screen.getByRole("button", { name: /Create My Avatar/ });
}

let alertSpy: ReturnType<typeof vi.fn>;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  authStateStub.isAuthenticated = true;
  authStateStub.isLoading = false;
  routerPushSpy.mockReset();
  alertSpy = vi.fn();
  window.alert = alertSpy as any;
  fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CreateAvatarPage", () => {
  it("S1-UT-10 sign-in check: branch !isLoading && !isAuthenticated taken both ways", () => {
    authStateStub.isAuthenticated = false;
    const { container } = render(<CreateAvatarPage />);
    expect(routerPushSpy).toHaveBeenCalledWith("/login?callbackUrl=/create-avatar");
    expect(container.innerHTML).toBe("");
    cleanup();

    authStateStub.isLoading = true; // still loading: no redirect yet
    render(<CreateAvatarPage />);
    expect(routerPushSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Create Your Avatar")).toBeTruthy();
  });

  it("S1-UT-11 (a) file type: branch !file.type.startsWith('image/') is true for a PDF", () => {
    const { container } = render(<CreateAvatarPage />);
    fireEvent.change(slotInputs(container)[0], { target: { files: [photo("front.pdf", "application/pdf")] } });
    expect(alertSpy).toHaveBeenCalledWith("Please upload a JPG, PNG or WebP image");
    expect(screen.queryByAltText("Front View preview")).toBeNull();
  });

  it("S1-UT-11 (b, c) file size boundaries: exactly 10 MB accepted, 10 MB + 1 byte rejected", async () => {
    const { container } = render(<CreateAvatarPage />);
    fireEvent.change(slotInputs(container)[0], { target: { files: [photo("front.jpg", "image/jpeg", TEN_MB)] } });
    expect(await screen.findByAltText("Front View preview")).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();

    // the front slot now shows a preview, so the first remaining input is the back slot
    fireEvent.change(slotInputs(container)[0], { target: { files: [photo("back.jpg", "image/jpeg", TEN_MB + 1)] } });
    expect(alertSpy).toHaveBeenCalledWith("Image size must be less than 10MB");
    expect(screen.queryByAltText("Back View preview")).toBeNull();
  });

  it("S1-UT-12 (a) replace a photo: Remove photo empties the slot so a new file can be chosen", async () => {
    const { container } = render(<CreateAvatarPage />);
    fireEvent.change(slotInputs(container)[0], { target: { files: [photo("front.jpg")] } });
    await screen.findByAltText("Front View preview");
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.queryByAltText("Front View preview")).toBeNull();
    expect(slotInputs(container)).toHaveLength(4);
  });

  it("S1-UT-12 (b, c) submit: disabled with 3 photos, uploads with all 4", async () => {
    const { container } = render(<CreateAvatarPage />);
    for (const [i, name] of ["Front View", "Back View", "Left Side"].entries()) {
      fireEvent.change(slotInputs(container)[0], { target: { files: [photo(`p${i}.jpg`)] } });
      await screen.findByAltText(`${name} preview`);
    }
    expect((createButton() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(slotInputs(container)[0], { target: { files: [photo("right.jpg")] } });
    await screen.findByAltText("Right Side preview");
    // all 4 photos are in, but the height is still missing
    expect((createButton() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Height in centimetres"), { target: { value: "175" } });
    expect((createButton() as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(createButton());
    expect(await screen.findByText("Processing...")).toBeTruthy();
    expect(await screen.findByText("Photos uploaded successfully!", {}, { timeout: 4000 })).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();

    // one request per photo, all sharing one batch id
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    const bodies = fetchSpy.mock.calls.map((c: any[]) => c[1].body as FormData);
    expect(bodies.map((b) => b.get("slot")).sort()).toEqual(["back", "front", "left", "right"]);
    expect(new Set(bodies.map((b) => b.get("batch"))).size).toBe(1);
    expect(bodies.every((b) => b.get("heightCm") === "175")).toBe(true);
  });

  it("S2-HT-01 height in feet and inches is converted to centimetres", async () => {
    const { container } = render(<CreateAvatarPage />);
    for (const [i, name] of ["Front View", "Back View", "Left Side", "Right Side"].entries()) {
      fireEvent.change(slotInputs(container)[0], { target: { files: [photo(`p${i}.jpg`)] } });
      await screen.findByAltText(`${name} preview`);
    }
    fireEvent.click(screen.getByRole("button", { name: "Use ft / in" }));
    fireEvent.change(screen.getByLabelText("Height, feet"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Height, inches"), { target: { value: "9" } });
    fireEvent.click(createButton());
    await screen.findByText("Photos uploaded successfully!", {}, { timeout: 4000 });
    expect((fetchSpy.mock.calls[0][1].body as FormData).get("heightCm")).toBe("175.3");
  });

  it("S2-HT-02 an impossible height keeps the button disabled", async () => {
    const { container } = render(<CreateAvatarPage />);
    for (const [i, name] of ["Front View", "Back View", "Left Side", "Right Side"].entries()) {
      fireEvent.change(slotInputs(container)[0], { target: { files: [photo(`p${i}.jpg`)] } });
      await screen.findByAltText(`${name} preview`);
    }
    const input = screen.getByLabelText("Height in centimetres");
    for (const bad of ["", "50", "99.9", "251", "abc"]) {
      fireEvent.change(input, { target: { value: bad } });
      expect((createButton() as HTMLButtonElement).disabled).toBe(true);
    }
    fireEvent.change(input, { target: { value: "100" } }); // lowest allowed
    expect((createButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("S1-UT-12 (d) server rejects a photo: the error is shown and success is not", async () => {
    fetchSpy.mockResolvedValue({ ok: false, json: async () => ({ error: "front: image must be under 10MB" }) });
    const { container } = render(<CreateAvatarPage />);
    for (const [i, name] of ["Front View", "Back View", "Left Side", "Right Side"].entries()) {
      fireEvent.change(slotInputs(container)[0], { target: { files: [photo(`p${i}.jpg`)] } });
      await screen.findByAltText(`${name} preview`);
    }
    fireEvent.change(screen.getByLabelText("Height in centimetres"), { target: { value: "175" } });
    fireEvent.click(createButton());
    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith("front: image must be under 10MB"));
    expect(screen.queryByText("Photos uploaded successfully!")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1); // stops at the first failure
  });
});

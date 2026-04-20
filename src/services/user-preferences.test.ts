import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSetDoc, mockGetDoc, mockDoc, mockDeleteField } = vi.hoisted(() => ({
  mockSetDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockDoc: vi.fn(() => "docRef"),
  mockDeleteField: vi.fn(() => "__deleteField__"),
}));

vi.mock("firebase/firestore", () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  deleteField: mockDeleteField,
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { saveUserPreferences, getUserPreferences } from "./user-preferences";

describe("saveUserPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
  });

  it("does NOT delete logoUrl when it is not provided", async () => {
    await saveUserPreferences({ userId: "u1", displayName: "Studio X" });

    const [, data] = mockSetDoc.mock.calls[0];
    expect(data).not.toHaveProperty("logoUrl");
    expect(mockDeleteField).not.toHaveBeenCalled();
  });

  it("sets logoUrl to deleteField() when explicitly null (user removed logo)", async () => {
    await saveUserPreferences({ userId: "u1", logoUrl: null as any });

    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.logoUrl).toBe("__deleteField__");
    expect(mockDeleteField).toHaveBeenCalledOnce();
  });

  it("preserves logoUrl when a URL string is provided", async () => {
    const url = "https://example.com/logo.png";
    await saveUserPreferences({ userId: "u1", logoUrl: url });

    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.logoUrl).toBe(url);
    expect(mockDeleteField).not.toHaveBeenCalled();
  });

  it("saves profile fields without touching logoUrl", async () => {
    await saveUserPreferences({
      userId: "u1",
      displayName: "Studio da Ana",
      serviceCategory: "Manicure, Sobrancelhas",
      isPublicProfile: true,
    });

    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.displayName).toBe("Studio da Ana");
    expect(data.serviceCategory).toBe("Manicure, Sobrancelhas");
    expect(data.isPublicProfile).toBe(true);
    expect(data).not.toHaveProperty("logoUrl");
    expect(mockDeleteField).not.toHaveBeenCalled();
  });

  it("uses merge: true so existing Firestore fields are preserved", async () => {
    await saveUserPreferences({ userId: "u1", displayName: "X" });

    const [, , options] = mockSetDoc.mock.calls[0];
    expect(options).toEqual({ merge: true });
  });
});

describe("getUserPreferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns preferences when document exists", async () => {
    const prefs = { userId: "u1", logoUrl: "https://x.com/logo.png", displayName: "X" };
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => prefs });

    const result = await getUserPreferences("u1");
    expect(result).toEqual(prefs);
  });

  it("returns null when document does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getUserPreferences("u1");
    expect(result).toBeNull();
  });
});

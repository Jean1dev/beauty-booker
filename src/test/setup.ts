import { vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  db: {},
  functions: {},
}));

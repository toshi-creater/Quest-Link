import '@testing-library/jest-dom'
import { vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

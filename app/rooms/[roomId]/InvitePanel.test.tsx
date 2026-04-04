import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

vi.mock("@phosphor-icons/react", () => ({
  LinkSimple: () => <span data-testid="icon-link" />,
  Copy: () => <span data-testid="icon-copy" />,
  Prohibit: () => <span data-testid="icon-prohibit" />,
  CircleNotch: () => <span data-testid="icon-spinner" />,
  Check: () => <span data-testid="icon-check" />,
}));

vi.mock("@/lib/api/rooms", () => ({
  generateInviteToken: vi.fn(),
  invalidateInviteToken: vi.fn(),
}));

import { useMutation } from "@tanstack/react-query";
import { InvitePanel } from "./InvitePanel";

const mockUseMutation = vi.mocked(useMutation);

type MutationConfig = {
  mutationFn?: () => Promise<unknown>;
  onSuccess?: (data: unknown) => void;
};

function makeMutation(overrides: Partial<ReturnType<typeof useMutation>> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useMutation>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockReturnValue(makeMutation());
});

describe("InvitePanel", () => {
  it("初期状態では「招待リンクを生成」ボタンが表示される", () => {
    render(<InvitePanel roomId="room-1" />);
    expect(screen.getByText("招待リンクを生成")).toBeInTheDocument();
  });

  it("「招待リンクを生成」ボタンをクリックすると generateMutation.mutate が呼ばれる", () => {
    const generateMutate = vi.fn();
    mockUseMutation
      .mockReturnValueOnce(makeMutation({ mutate: generateMutate }))
      .mockReturnValueOnce(makeMutation());

    render(<InvitePanel roomId="room-1" />);
    fireEvent.click(screen.getByText("招待リンクを生成"));
    expect(generateMutate).toHaveBeenCalledTimes(1);
  });

  it("生成中は「招待リンクを生成」ボタンが無効化される", () => {
    mockUseMutation
      .mockReturnValueOnce(makeMutation({ isPending: true }))
      .mockReturnValueOnce(makeMutation());

    render(<InvitePanel roomId="room-1" />);
    expect(screen.getByText("招待リンクを生成").closest("button")).toBeDisabled();
  });

  it("生成エラー時にエラーメッセージが表示される", () => {
    mockUseMutation
      .mockReturnValueOnce(makeMutation({ isError: true, error: new Error("生成に失敗しました") }))
      .mockReturnValueOnce(makeMutation());

    render(<InvitePanel roomId="room-1" />);
    expect(screen.getByText("生成に失敗しました")).toBeInTheDocument();
  });

  it("onSuccess でトークンがセットされると招待URLが表示される", async () => {
    let capturedOnSuccess: ((data: unknown) => void) | undefined;
    mockUseMutation.mockImplementation((config: MutationConfig) => {
      if (!capturedOnSuccess && config.onSuccess) {
        capturedOnSuccess = config.onSuccess;
      }
      return makeMutation();
    });

    render(<InvitePanel roomId="room-1" />);

    capturedOnSuccess?.({ data: { inviteToken: "abc123" } });

    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });
  });

  it("「リンクを無効化」ボタンをクリックすると invalidateMutation.mutate が呼ばれる", async () => {
    const invalidateMutate = vi.fn();
    let capturedOnSuccess: ((data: unknown) => void) | undefined;

    mockUseMutation.mockImplementation((config: MutationConfig) => {
      if (!capturedOnSuccess && config.onSuccess) {
        capturedOnSuccess = config.onSuccess;
        return makeMutation();
      }
      return makeMutation({ mutate: invalidateMutate });
    });

    render(<InvitePanel roomId="room-1" />);
    capturedOnSuccess?.({ data: { inviteToken: "abc123" } });

    await waitFor(() => {
      expect(screen.getByText("リンクを無効化")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("リンクを無効化"));
    expect(invalidateMutate).toHaveBeenCalledTimes(1);
  });
});

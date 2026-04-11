import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OAuthButton } from "./OAuthButton";

describe("OAuthButton", () => {
  it.each(["google", "twitter", "discord"] as const)(
    "provider=%s のラベルが表示される",
    (provider) => {
      render(<OAuthButton provider={provider} />);
      const labels = {
        google: "Googleでログイン",
        twitter: "X（Twitter）でログイン",
        discord: "Discordでログイン",
      };
      expect(screen.getByText(labels[provider])).toBeInTheDocument();
    }
  );

  it("onClick が渡されたとき、クリックで呼ばれる", () => {
    const onClick = vi.fn();
    render(<OAuthButton provider="google" onClick={onClick} />);
    fireEvent.click(screen.getByText("Googleでログイン"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("type='submit' のとき button type が submit になる", () => {
    render(<OAuthButton provider="google" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("type 未指定のとき button type が button になる", () => {
    render(<OAuthButton provider="google" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OAuthButtonGroup } from "./OAuthButtonGroup";

describe("OAuthButtonGroup", () => {
  it("3種のOAuthボタンが表示される", () => {
    render(<OAuthButtonGroup onSignIn={vi.fn()} />);
    expect(screen.getByText("Googleでログイン")).toBeInTheDocument();
    expect(screen.getByText("X（Twitter）でログイン")).toBeInTheDocument();
    expect(screen.getByText("Discordでログイン")).toBeInTheDocument();
  });

  it("Googleボタンクリックで onSignIn('google') が呼ばれる", () => {
    const onSignIn = vi.fn();
    render(<OAuthButtonGroup onSignIn={onSignIn} />);
    fireEvent.click(screen.getByText("Googleでログイン"));
    expect(onSignIn).toHaveBeenCalledWith("google");
  });

  it("Xボタンクリックで onSignIn('twitter') が呼ばれる", () => {
    const onSignIn = vi.fn();
    render(<OAuthButtonGroup onSignIn={onSignIn} />);
    fireEvent.click(screen.getByText("X（Twitter）でログイン"));
    expect(onSignIn).toHaveBeenCalledWith("twitter");
  });

  it("Discordボタンクリックで onSignIn('discord') が呼ばれる", () => {
    const onSignIn = vi.fn();
    render(<OAuthButtonGroup onSignIn={onSignIn} />);
    fireEvent.click(screen.getByText("Discordでログイン"));
    expect(onSignIn).toHaveBeenCalledWith("discord");
  });
});

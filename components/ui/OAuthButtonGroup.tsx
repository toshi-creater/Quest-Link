"use client";

import { OAuthButton, type OAuthProvider } from "./OAuthButton";

type Props = {
  onSignIn: (provider: OAuthProvider) => void;
};

export function OAuthButtonGroup({ onSignIn }: Props) {
  return (
    <div className="space-y-2.5">
      <OAuthButton provider="google" onClick={() => onSignIn("google")} />
      <OAuthButton provider="twitter" onClick={() => onSignIn("twitter")} />
      <OAuthButton provider="discord" onClick={() => onSignIn("discord")} />
    </div>
  );
}

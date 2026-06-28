"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "このメールアドレスは別のログイン方法で登録されています",
  OAuthSignin: "ログインに失敗しました。再度お試しください",
  OAuthCallback: "ログインに失敗しました。再度お試しください",
  AccessDenied: "アクセスが拒否されました",
  Verification: "確認リンクが無効か期限切れです",
  Default: "ログインに失敗しました",
};

export function LoginErrorToast({ error }: { error: string }) {
  useEffect(() => {
    toast.error(OAUTH_ERROR_MESSAGES[error] ?? OAUTH_ERROR_MESSAGES.Default);
  }, [error]);

  return null;
}

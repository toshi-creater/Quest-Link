import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | QuestLink",
};

export default function PrivacyPage() {
  const contactEmail = process.env.CONTACT_EMAIL ?? "support@questlink.app";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-24 md:pb-10">
      <h1 className="mb-8 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        プライバシーポリシー
      </h1>
      <div className="space-y-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            1. はじめに
          </h2>
          <p>
            QuestLink（以下「本サービス」）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。本サービスをご利用の際は、本ポリシーをお読みいただき、内容をご理解いただいたうえでご利用ください。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            2. 取得する個人情報と利用目的
          </h2>
          <p className="mb-2">本サービスは、OAuthログイン時に以下の情報を取得します。</p>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>メールアドレス</li>
            <li>表示名・プロフィール画像URL</li>
            <li>OAuthプロバイダが発行するユーザー識別子</li>
          </ul>
          <p>取得した情報は、アカウント認証・プロフィール表示・サービス運営のためにのみ使用します。</p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            3. 第三者提供
          </h2>
          <p className="mb-3">
            本サービスは、法令に基づく場合またはユーザーの同意がある場合を除き、取得した個人情報を第三者に提供しません。以下はサービス提供に伴う委託先への提供です。
          </p>
          <p className="mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
            OAuthプロバイダ（認証連携）
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>Google LLC（Google ログイン）</li>
            <li>X Corp.（X / Twitter ログイン）</li>
            <li>Discord Inc.（Discord ログイン）</li>
          </ul>
          <p className="mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
            インフラ委託先
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Vercel Inc.（Webホスティング）</li>
            <li>Railway（バックエンド・データベースホスティング）</li>
            <li>Supabase Inc.（データベース）</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            4. 保存期間
          </h2>
          <p>
            ユーザーが退会した場合、アカウント情報は速やかに削除します。ただし、退会前に投稿したチャットメッセージについては、サービスの性質上、送信者情報を匿名化したうえで保持する場合があります。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            5. Cookieおよび外部送信について
          </h2>
          <p>
            本サービスは、セッション管理のためにCookieを使用します。また、OAuthログイン時にGoogle・X・Discordなどの外部サービスへ認証情報が送信されます。ブラウザの設定によりCookieを無効にすることができますが、その場合一部の機能が利用できなくなることがあります。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            6. 個人情報の開示・訂正・削除の請求窓口
          </h2>
          <p className="mb-2">
            個人情報の開示・訂正・削除・利用停止等のご請求は、以下の窓口までメールにてご連絡ください。ご本人確認のうえ、合理的な期間内にご対応いたします。
          </p>
          <p>
            お問い合わせ先：
            <a
              href={`mailto:${contactEmail}`}
              className="ml-1 underline transition-colors hover:text-white"
              style={{ color: "var(--accent-light)" }}
            >
              {contactEmail}
            </a>
          </p>
        </section>

        <p className="pt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          制定日：2026年5月26日
        </p>
      </div>
      <div className="mt-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80"
          style={{ color: "var(--accent-light)" }}
        >
          ← ログインに戻る
        </Link>
      </div>
    </div>
  );
}

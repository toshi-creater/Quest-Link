import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-28 sm:px-6 sm:pb-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
        style={{ color: "var(--accent-light)" }}
      >
        ← トップへ戻る
      </Link>

      <h1 className="mb-2 mt-6 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        運営者情報・お問い合わせ
      </h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        個人情報の保護に関する法律（第33〜39条）に基づく開示等請求の受付窓口です。
      </p>

      <div className="space-y-4">
        {/* 運営者情報 */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            運営者情報
          </h2>
          <dl className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-32 font-medium" style={{ color: "var(--text-primary)" }}>
                サービス名
              </dt>
              <dd>QuestLink</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-32 font-medium" style={{ color: "var(--text-primary)" }}>
                運営形態
              </dt>
              <dd>個人運営</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="min-w-32 font-medium" style={{ color: "var(--text-primary)" }}>
                お問い合わせ先
              </dt>
              <dd>
                <a
                  href="mailto:7021time.is.money@gmail.com"
                  className="transition-opacity hover:opacity-70 hover:underline"
                  style={{ color: "var(--accent-light)" }}
                >
                  7021time.is.money@gmail.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        {/* 個人情報の開示等請求の受付窓口 */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            個人情報の開示等請求の受付窓口
          </h2>
          <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            個人情報保護法に基づき、ご本人またはその代理人から以下の請求を受け付けます。
          </p>
          <ul className="mb-4 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              保有個人データの開示請求（法第33条）
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              保有個人データの内容の訂正・追加・削除請求（法第34条）
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              保有個人データの利用停止・消去請求（法第35条）
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              第三者提供の停止請求（法第37条）
            </li>
          </ul>
          <div
            className="rounded-lg p-4 text-sm leading-relaxed"
            style={{
              backgroundColor: "rgba(124,58,237,0.08)",
              color: "var(--text-secondary)",
            }}
          >
            <p className="mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
              請求方法
            </p>
            <p>
              上記メールアドレス宛に件名「個人情報開示等請求」としてご連絡ください。ご本人確認のため、お名前・登録メールアドレス・請求内容をお知らせください。代理人の場合は委任状の添付をお願いします。
            </p>
          </div>
        </section>

        {/* 苦情・不適切コンテンツの報告 */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            苦情・不適切コンテンツの報告
          </h2>
          <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            以下のような問題を発見した場合は、下記の窓口へご報告ください。
          </p>
          <ul className="mb-4 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              ハラスメント・誹謗中傷などの不適切な発言
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              サービスの不正利用・スパム行為
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              プライバシーの侵害
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent-light)" }}>•</span>
              その他サービス運営に関するご意見・ご要望
            </li>
          </ul>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            報告先:{" "}
            <a
              href="mailto:7021time.is.money@gmail.com"
              className="transition-opacity hover:opacity-70 hover:underline"
              style={{ color: "var(--accent-light)" }}
            >
              7021time.is.money@gmail.com
            </a>
            （件名に「コンテンツ報告」とご記入ください）
          </p>
        </section>

        {/* お問い合わせ対応の目安 */}
        <section
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            お問い合わせ対応の目安
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            お問い合わせ受付後、<span style={{ color: "var(--text-primary)" }}>7 営業日以内</span>
            を目安にご回答いたします。内容により回答に時間がかかる場合や、対応が困難な場合はご連絡いたします。
          </p>
        </section>
      </div>

      <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
        最終更新: 2026年5月
      </p>
    </div>
  );
}

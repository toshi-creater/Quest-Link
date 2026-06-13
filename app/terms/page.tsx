import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | QuestLink",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-24 md:pb-10">
      <h1 className="mb-8 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        利用規約
      </h1>
      <div className="space-y-8 text-sm" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第1条（適用）
          </h2>
          <p>
            本規約は、QuestLink（以下「本サービス」）の利用に関する条件を定めるものであり、本サービスを利用するすべてのユーザーに適用されます。本サービスをご利用になった場合、本規約に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第2条（禁止事項）
          </h2>
          <p className="mb-2">ユーザーは、本サービスの利用にあたり以下の行為を行ってはなりません。</p>
          <ul className="list-inside list-disc space-y-1">
            <li>不正アクセスその他のサービスへの攻撃行為</li>
            <li>荒らし・嫌がらせ・他のユーザーへの迷惑行為</li>
            <li>スパム・広告・勧誘目的のメッセージ送信</li>
            <li>他のユーザーや第三者へのなりすまし行為</li>
            <li>法令または公序良俗に違反する行為</li>
            <li>その他、運営が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第3条（免責事項）
          </h2>
          <p>
            本サービスは現状有姿で提供されます。運営は、サービスの中断・停止・変更・終了、またはユーザーが被った損害について、法令上の責任を負う場合を除き、一切の責任を負いません。ユーザー間のトラブルについても同様とします。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第4条（未成年者の利用）
          </h2>
          <p>
            未成年者が本サービスを利用する場合は、保護者の同意を得たうえでご利用ください。未成年者が保護者の同意なく本サービスを利用した場合、保護者はその利用行為に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第5条（規約の変更）
          </h2>
          <p>
            本規約は、民法第548条の4に基づく定型約款の変更として、ユーザーの一般の利益に適合する場合、または変更の必要性・内容の相当性その他の事情に照らして合理的なものである場合に、あらかじめ変更の内容および効力発生時期を本サービス上で告知することにより、変更することができます。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            第6条（準拠法および裁判管轄）
          </h2>
          <p>
            本規約は日本法を準拠法とします。本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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
          ← 戻る
        </Link>
      </div>
    </div>
  );
}

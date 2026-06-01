# アーキテクチャ設計書

---

## 1. 全体構成図

### システム構成図

```
┌──────────────────────────────────────────────────────┐
│                      Client (Browser)                 │
└───────────┬──────────────────────┬───────────────────┘
            │ HTTPS                │ WSS（ログイン済み・ゲスト参加者）
            ▼                      ▼
┌───────────────────┐   ┌─────────────────────┐
│   Vercel          │   │   Railway           │
│   Next.js         │   │   Socket.IO サーバー │
│   SSR/RSC + REST  │   │   (チャット専用・独立)│
│   API (/api/v1)   │   │                     │
└─────────┬─────────┘   └──────────┬──────────┘
          │                        │
          └───────────┬────────────┘
                      ▼
       ┌──────────────┐ ┌──────────────────────┐
       │  PostgreSQL  │ │  Redis               │
       │  (Supabase)  │ │  (Socket.IO Adapter) │
       └──────────────┘ └──────────────────────┘

       別系統: バッチ ──HTTPS──▶ IGDB API (Twitch)
                              （ゲームマスタ定期同期）
```

> REST API は Next.js の API Routes（`/api/v1`）が担い、リアルタイムのチャットのみ独立した Socket.IO サーバー（`socket-server/`）が処理する。両者は同じ PostgreSQL を参照し、Socket.IO は複数ノード間のブロードキャスト同期に Redis Adapter を使う。

### ネットワーク構成

| 通信 | プロトコル | 対象 |
|------|----------|------|
| クライアント ↔ Next.js（SSR + REST API） | HTTPS | 全ユーザー |
| クライアント ↔ Socket.IO サーバー | WSS | ログイン済み・ゲスト参加者（チャットのみ） |
| Next.js ↔ PostgreSQL | 内部ネットワーク | - |
| Socket.IO サーバー ↔ PostgreSQL | 内部ネットワーク | - |
| Socket.IO サーバー ↔ Redis | 内部ネットワーク | ノード間ブロードキャスト同期（Redis Adapter） |
| バッチ ↔ IGDB API（Twitch） | HTTPS | ゲームマスタの定期同期 |

### 外部サービス連携

| サービス | 用途 | 方式 |
|---------|------|------|
| Google OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| X (Twitter) OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| Discord OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| IGDB API（Twitch 認証） | ゲームマスタの取得・同期 | REST API（バッチ） |

> 部屋への招待は、サーバーで発行する招待トークン付きリンク（`/api/v1/rooms/:id/invite`）を共有する方式。外部 SNS への自動投稿（X Share API / Discord Webhook）は現時点では未実装。

---

## 2. レイヤー設計

### フロントエンド構成

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript（strict、`any` 禁止） |
| スタイリング | Tailwind CSS v4（PC・モバイルブラウザ両対応のレスポンシブデザイン必須） |
| UI コンポーネント | 自前の Tailwind コンポーネント（`components/ui/`）＋ Phosphor Icons。外部 UI ライブラリには依存しない |
| 状態管理 | Zustand（WebSocket イベントの反映・グローバル状態） |
| データフェッチ | TanStack Query（REST API のキャッシュ・再取得） |
| リアルタイム通信 | Socket.IO Client（チャットルームのみ） |
| 認証 | NextAuth.js（OAuth state 管理・セッション） |
| ホスティング | Vercel |

**画面更新方針**
- 部屋一覧・参加前プレビュー：画面更新時のみ REST API で取得（ポーリングなし・WebSocket なし）
- チャットルーム：WebSocket（ログイン済み・ゲスト参加者が接続。ゲストはゲストセッション ID で認可）

### バックエンド構成

| 項目 | 内容 |
|------|------|
| ランタイム | Node.js 20 LTS |
| REST API | Next.js API Routes（`/api/v1`。Vercel 上で動作） |
| リアルタイム通信 | 独立した Socket.IO サーバー（`socket-server/`。チャット専用、Railway 上で動作） |
| ORM | Prisma 7（`@prisma/adapter-pg` 経由で PostgreSQL に接続） |
| バリデーション | Zod |
| 認証セッション | NextAuth.js v5 の JWT セッション（サーバーサイドのセッションストアは持たない）。ゲストは署名付き Cookie（`quest_link_guest_session`）＋ DB の参加レコードで認可。WebSocket 接続時は有効期限 60 秒の短命 JWT（socket-token）を発行 |
| ホスティング | Railway（Socket.IO サーバー・バッチ） |

### BFF

なし。Next.js の Server Components / API Routes が薄い集約層を担う。

### アーキテクチャ方式

**2 サービス構成**（Phase 1）。Next.js（SSR + REST API、Vercel）と Socket.IO サーバー（チャット専用、Railway）に分離。HTTP とロングコネクションで負荷特性が異なるため別プロセスとし、それぞれを独立してスケールできるようにした。さらなるマイクロサービス分割は Phase 3 以降に検討。

---

## 3. 技術選定理由

### 使用技術と選定理由

| 技術 | 選定理由 |
|------|---------|
| Next.js | SSR による初期表示と SEO。未ログインでの部屋一覧・プレビューの公開に対応しやすい。REST API も API Routes で同居させ、サービス数を抑える |
| 自前 Tailwind コンポーネント | デザイン要件（落ち着いたダーク×パープル、ゲームアートを主役）に合わせて細かく作り込むため、外部 UI ライブラリではなく `components/ui/` に自前実装。依存を増やさずスタイルを完全に制御できる |
| Socket.IO | WebSocket の接続管理・ルームブロードキャストが組み込み。Redis Adapter を追加するだけで水平スケール対応可能。REST とは別プロセスの独立サーバーとして運用 |
| PostgreSQL | リレーショナルデータ（ユーザー・部屋・評価・ゲームマスター）の整合性制約を DB レベルで保証。評価の重複禁止を UNIQUE 制約で実装。部屋名・募集文の全文検索に `tsvector` + `GIN` インデックスを使用 |
| Redis | Socket.IO Redis Adapter として使用し、複数ノード間のチャットブロードキャストを同期。WebSocket の水平スケールに対応 |
| Prisma | 型安全なクエリ。マイグレーション管理が組み込み |
| Zustand | WebSocket イベントを store に反映するパターンが簡潔に書ける |
| TanStack Query | 部屋一覧の画面更新時再取得・評価送信後のキャッシュ無効化を宣言的に管理 |

### 不採用技術と理由

| 技術 | 不採用理由 |
|------|----------|
| Go (Gin) | Socket.IO の公式サポートがなく WebSocket を自前実装する必要がある。フロントとの型共有も不可 |
| 専用バックエンド（Fastify など） | REST API は Next.js の API Routes で要件を満たせる。サービス数を増やさず、フロントと型・バリデーション（Zod）を共有できる。負荷特性が異なる WebSocket のみ独立サーバーに切り出した |
| GraphQL | オーバーエンジニアリング。REST + Zod で十分な型安全を確保できる |
| ポーリング（部屋一覧） | 不要な負荷を生む。画面更新時取得で要件を満たせる |
| Mantine / Chakra UI / shadcn/ui | デザインを細部までコントロールしたいため、外部 UI ライブラリに依存せず Tailwind で自前実装する方針を採用 |

---

## 4. スケーリング方針

### 水平 / 垂直スケール

| フェーズ | 方針 |
|---------|------|
| Phase 1（同時接続 100〜500） | Next.js（Vercel）と Socket.IO サーバー（Railway）の 2 サービス。Socket.IO Redis Adapter は導入済みで、必要に応じてノードを増やせる状態 |
| Phase 2（同時接続 5,000） | Socket.IO サーバーを複数ノードに水平スケール（Adapter 済みのためノード追加のみ）。PostgreSQL に読み取りレプリカを追加 |
| Phase 3（同時接続 50,000） | コンテナオーケストレーション（ECS / Cloud Run）への移行。DB シャーディングを検討 |

### キャッシュ戦略

| 対象 | 方式 |
|------|------|
| 認証セッション | NextAuth JWT（クライアント Cookie に保持。サーバー側ストア不要） |
| WebSocket ブロードキャスト | Redis Pub/Sub（Socket.IO Redis Adapter） |
| 部屋一覧・プレビュー | TanStack Query のクライアントキャッシュ（画面更新時に無効化）。静的データは Next.js の `"use cache"` を明示付与 |
| 静的アセット | Vercel Edge CDN |

### CDN

Vercel Edge Network を使用。静的アセットのみ対象。API・WebSocket は CDN を経由しない。

---

## 5. 障害対策

### 冗長化

| 対象 | Phase 1 | Phase 2 以降 |
|------|---------|------------|
| バックエンド | シングルインスタンス | Railway の複数インスタンス + ロードバランサー |
| PostgreSQL | Supabase のマネージド HA | 読み取りレプリカ追加 |
| Redis | Railway のマネージド Redis | レプリカ構成を検討 |

### フェイルオーバー

- PostgreSQL・Redis はマネージドサービスの自動フェイルオーバーに委ねる（Phase 1）
- WebSocket 切断時は Socket.IO の自動再接続で対応（クライアント側）
- ホスト離脱時は参加順が最も早いユーザーへの自動引き継ぎをアプリレベルで実装

### バックアップ設計

| 対象 | 方式 |
|------|------|
| PostgreSQL | Supabase の自動日次バックアップ |
| Redis | Socket.IO Adapter の Pub/Sub 用途のため永続化不要。障害時は WebSocket が自動再接続し、認証セッション（JWT）・ゲスト認可（Cookie + DB）は影響を受けない |

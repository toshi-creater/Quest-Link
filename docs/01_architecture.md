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
│   Next.js         │   │   Fastify + Socket.IO│
│   (SSR / RSC)     │   │   REST API          │
└───────────────────┘   └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           ┌──────────────┐ ┌──────────┐ ┌─────────────┐
           │  PostgreSQL  │ │  Redis   │ │  外部API    │
           │  (Supabase)  │ │          │ │  X / Discord│
           └──────────────┘ └──────────┘ └─────────────┘
```

### ネットワーク構成

| 通信 | プロトコル | 対象 |
|------|----------|------|
| クライアント ↔ Next.js | HTTPS | 全ユーザー |
| クライアント ↔ Fastify | HTTPS / WSS | HTTPS: 全ユーザー、WSS: ログイン済み・ゲスト参加者 |
| Fastify ↔ PostgreSQL | 内部ネットワーク | - |
| Fastify ↔ Redis | 内部ネットワーク | - |
| Fastify ↔ 外部 API | HTTPS | X Share API、Discord Webhook |

### 外部サービス連携

| サービス | 用途 | 方式 |
|---------|------|------|
| Google OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| X OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| Discord OAuth 2.0 | ソーシャルログイン | OAuth 2.0 |
| X Share API | 募集リンクの投稿 | REST API |
| Discord Webhook | 募集リンクの投稿 | Webhook POST |

---

## 2. レイヤー設計

### フロントエンド構成

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS（PC・モバイルブラウザ両対応のレスポンシブデザイン必須） |
| UI コンポーネント | shadcn/ui（Tailwind CSS + Radix UI ベース。ダークモード標準対応） |
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
| フレームワーク | Fastify |
| 言語 | TypeScript |
| リアルタイム通信 | Socket.IO Server（チャット専用） |
| ORM | Prisma |
| バリデーション | Zod |
| セッション | Redis（サーバーサイドセッション）。ログイン済みセッションとゲストセッション（TTL 24時間）を分離管理 |
| ホスティング | Railway |

### BFF

なし。Next.js の Server Components / API Routes が薄い集約層を担う。

### アーキテクチャ方式

**モノリス**（Phase 1）。フロントエンド（Vercel）とバックエンド（Railway）の2サービス構成。マイクロサービス分割は Phase 3 以降に検討。

---

## 3. 技術選定理由

### 使用技術と選定理由

| 技術 | 選定理由 |
|------|---------|
| Next.js | SSR による初期表示と SEO。未ログインでの部屋一覧・プレビューの公開に対応しやすい |
| shadcn/ui | Tailwind CSS + Radix UI ベースのコンポーネント集。既存スタックと完全一致。コードが手元に置かれるためバージョンアップに依存しない。ダークモード標準対応でゲーミング向けUIへの改変が容易 |
| Fastify | Node.js フレームワーク中で高スループット。Zod との統合でリクエスト検証と型安全を同時に実現 |
| Socket.IO | WebSocket の接続管理・ルームブロードキャストが組み込み。Phase 2 以降に Redis Adapter を追加するだけで水平スケール対応可能 |
| PostgreSQL | リレーショナルデータ（ユーザー・部屋・評価・ゲームマスター）の整合性制約を DB レベルで保証。評価の重複禁止を UNIQUE 制約で実装。部屋名・募集文の全文検索に `tsvector` + `GIN` インデックスを使用 |
| Redis | セッション管理（Phase 1）。Phase 2 以降で Socket.IO Redis Adapter に転用し WebSocket の水平スケールに対応 |
| Prisma | 型安全なクエリ。マイグレーション管理が組み込み |
| Zustand | WebSocket イベントを store に反映するパターンが簡潔に書ける |
| TanStack Query | 部屋一覧の画面更新時再取得・評価送信後のキャッシュ無効化を宣言的に管理 |

### 不採用技術と理由

| 技術 | 不採用理由 |
|------|----------|
| Go (Gin) | Socket.IO の公式サポートがなく WebSocket を自前実装する必要がある。フロントとの型共有も不可 |
| GraphQL | オーバーエンジニアリング。REST + Zod で十分な型安全を確保できる |
| ポーリング（部屋一覧） | 不要な負荷を生む。画面更新時取得で要件を満たせる |
| Discord OAuth Bot | MVP では Webhook で十分。Bot 方式は審査・開発コストが高い |
| Mantine / Chakra UI | Tailwind CSS との競合が起きやすい。shadcn/ui で同等機能を賄えるため不採用 |

---

## 4. スケーリング方針

### 水平 / 垂直スケール

| フェーズ | 方針 |
|---------|------|
| Phase 1（同時接続 100〜500） | 単一サーバー。垂直スケールで対応 |
| Phase 2（同時接続 5,000） | Socket.IO に Redis Adapter を追加して WebSocket サーバーを水平スケール。PostgreSQL に読み取りレプリカを追加 |
| Phase 3（同時接続 50,000） | コンテナオーケストレーション（ECS / Cloud Run）への移行。DB シャーディングを検討 |

### キャッシュ戦略

| 対象 | 方式 |
|------|------|
| セッション | Redis（ログイン済みセッション + ゲストセッション TTL 24時間） |
| 部屋一覧・プレビュー | TanStack Query のクライアントキャッシュ（画面更新時に無効化） |
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
| Redis | セッションデータのため永続化不要。障害時はログイン済みユーザーは再ログイン、ゲストは再参加で復旧 |

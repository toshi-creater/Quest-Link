# QuestLink

**今日、一緒にゲームできる人をすぐに見つけられる。ゲームパーティ検索プラットフォーム**
ゲームの部屋を作成・参加し、チャットで合流し、一緒にゲームをプレイする場を提供する。

知らない人と一緒にプレイするハードルを下げて、気軽に参加できるプラットフォームを目指した個人開発プロジェクト。
部屋への参加リンクを発行することで別媒体(X、Discode)などへも募集をかけることが可能。


* URL: [https://quest-link.app](https://quest-link.app) 
* 設計ドキュメント: [`docs/`](docs/) 


## アーキテクチャのポイント

- **負荷テスト駆動の性能改善** — **k6**で本番相当の負荷シナリオ（最大 350 同時ユーザー）を作成し、ボトルネックを特定 → DB クエリ・インデックスを改善し、部屋一覧 API の **p95 を 1,286ms → 605ms（約 2.1 倍）** に短縮。[詳細](#負荷テストとパフォーマンス改善)

- **リアルタイム通信の水平スケール設計** — Socket.IO + Redis Adapter で複数ノードにまたがるチャットの fan-out に対応。REST（Next.js）と WebSocket（独立サーバー）を分離し、それぞれを独立してスケールできる構成にした。

- **整合性を DB レベルで保証** — 「同一部屋への二重参加」「評価の重複」を UNIQUE / 部分インデックスで防止。参加処理は CTE で **9 RTT → 2 RTT** に集約し、競合下でも壊れにくい設計。



## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.x |
| スタイリング | Tailwind CSS v4 |
| ORM | Prisma 7.x |
| DB | PostgreSQL（Supabase / Railway） |
| リアルタイム通信 | Socket.IO 4.x（独立サーバー + Redis Adapter） |
| キャッシュ / セッション | Redis（ioredis） |
| 認証 | NextAuth.js 5.x (Google OAuth 2.0) |
| 状態管理 | Zustand 5.x |
| データフェッチ | TanStack Query 5.x |
| ゲームマスタ連携 | IGDB API（定期バッチ同期） |
| 負荷テスト | k6 |
| テスト | Vitest / Playwright |
| ホスティング | Vercel / Railway |
| パッケージマネージャ | pnpm |


## 必要な環境

- Node.js 20.x LTS
- pnpm 9.x 以上
- Docker / Docker Compose（PostgreSQL・Redis 用）
- Google Cloud アカウント（OAuth 2.0 認証情報）
- Twitch Developer アカウント（IGDB API アクセス用）

## ローカル環境セットアップ手順

### 1. リポジトリのクローン

```bash
git clone git@github.com:toshi-creater/Quest-Link.git
cd Quest-Link
```

### 2. 依存パッケージのインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env` ファイルをプロジェクトルートに作成し、以下の変数を設定する。

```env
# データベース
DATABASE_URL="postgresql://postgres:password@localhost:5432/questlink?schema=public"

# NextAuth.js v5 シークレット（openssl rand -base64 32 で生成）
AUTH_SECRET="your-secret-key"

# Google OAuth 2.0
# https://console.cloud.google.com/ で取得
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# IGDB API (Twitch Developer)
# https://dev.twitch.tv/console で取得
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# Redis
REDIS_URL="redis://localhost:6379"
```

### 4. データベースの起動

Docker Compose で PostgreSQL 16 と Redis 7 を起動する。

```bash
docker compose up -d redis
```

起動するサービス:
- **postgres**: PostgreSQL 16（ポート 5432）
- **redis**: Redis 7、AOF 永続化有効（ポート 6379）

### 5. データベースのマイグレーション

```bash
pnpm db:migrate
```

### 6. テストデータの投入（任意）

```bash
pnpm db:seed
```

### 7. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## 主なコマンド

```bash
pnpm dev          # 開発サーバー起動（Turbopack、ポート 3000）
pnpm build        # プロダクションビルド
pnpm start        # プロダクションサーバー起動
pnpm lint         # ESLint 実行
pnpm test         # Vitest によるユニットテスト
pnpm test:e2e     # Playwright による E2E テスト
pnpm db:migrate   # Prisma マイグレーション実行
pnpm db:seed      # テストデータ投入
```

## ディレクトリ構成

```
.
├── app/                  # App Router のページとレイアウト
│   ├── api/v1/           # API ルート
│   ├── login/            # ログイン画面
│   ├── rooms/            # 部屋一覧・作成・詳細・チャット・評価
│   └── users/            # プロフィール・編集・履歴
├── components/ui/        # 再利用可能な UI コンポーネント
├── docs/                 # 設計ドキュメント
├── lib/                  # ユーティリティと共有ロジック
└── prisma/               # データベーススキーマとマイグレーション
```

## 負荷テストとパフォーマンス改善

toC を想定し、**本番相当の負荷を意図的にかけてボトルネックを発見 → 改善**するサイクルを回した。シナリオは [`load-test/`](load-test/) に k6 スクリプトとして用意（ベースライン / 上限探索 / スパイク / WebSocket 耐久 / チャット fan-out）。

計測環境: Railway staging、シードデータ 200 部屋・350 ユーザー。

### 部屋一覧・参加フロー（100→350 同時ユーザーへ段階的に負荷）

DB クエリ・インデックスの改善前後で、同じシナリオを比較した。

| 指標 | 改善前 | 改善後 | 変化 |
|------|--------|--------|------|
| 総リクエスト数 | 344,540 | 367,000 | — |
| レイテンシ p50 | 618 ms | **256 ms** | 約 2.4 倍高速化 |
| レイテンシ p95 | 1,286 ms | **605 ms** | 約 2.1 倍高速化（目標 1,000ms をクリア） |
| レイテンシ p99 | 1,561 ms | **831 ms** | 約 1.9 倍高速化 |
| エラー率 | 0.85 % | 1.36 % | スループット向上後も低水準を維持 |


### 100 同時ユーザーのWebSocket耐久

| シナリオ | 結果 |
|----------|------|
| ベースライン（10→100 VU、25,839 req） | エラー率 **0%**、p95 **152 ms** |
| WebSocket 耐久（100 同時接続） | 接続成功率 **100%**、セッション安定・接続枯渇なし |


## ドキュメント

詳細な設計情報は `docs/` ディレクトリを参照。

| ファイル | 内容 |
|---------|------|
| `docs/08_architecture_overview.md` | **アーキテクチャ解説（図中心・コードを読まずに技術構成を把握できる）** |
| `docs/00_requirements.md` | 機能要件・ビジネス仕様 |
| `docs/01_architecture.md` | 技術スタック、システム図、技術選定理由 |
| `docs/02_database-design.md` | 完全スキーマ、Prisma モデル、インデックス設計 |
| `docs/05_00_api_overview.md` | API 規約、エラーコード |
| `docs/05_01_api_auth.md` | 認証エンドポイント |
| `docs/05_02_api_users.md` | ユーザー関連エンドポイント |
| `docs/05_03_api_rooms-chat.md` | ルーム／チャット関連エンドポイント + WebSocket イベント |
| `docs/05_04_api_ratings-tags.md` | 評価・タグ関連エンドポイント |
| `docs/06_sitemap.md` | フロントエンドルート構成・画面遷移フロー |

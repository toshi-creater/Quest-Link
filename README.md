# QuestLink

ゲーマー向けリアルタイムマッチングプラットフォーム。ゲームの部屋を作成・参加し、セッション後に相手を評価できる。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.x |
| スタイリング | Tailwind CSS v4 |
| ORM | Prisma 5.x |
| DB | PostgreSQL |
| リアルタイム通信 | Socket.IO 4.x |
| 認証 | NextAuth.js 5.x (Google OAuth 2.0) |
| 状態管理 | Zustand 4.x |
| HTTPクライアント | TanStack Query 5.x |
| パッケージマネージャ | pnpm |

## 必要な環境

- Node.js 20.x LTS
- pnpm 9.x 以上
- Docker / Docker Compose（PostgreSQL・Redis 用）
- Google Cloud アカウント（OAuth 2.0 認証情報）
- Twitch Developer アカウント（IGDB API アクセス用）

## セットアップ手順

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

`.env.local` ファイルをプロジェクトルートに作成し、以下の変数を設定する。

```env
# データベース
DATABASE_URL="postgresql://postgres:password@localhost:5432/questlink"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"   # openssl rand -base64 32 で生成

# Google OAuth 2.0
# https://console.cloud.google.com/ で取得
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# IGDB API (Twitch Developer)
# https://dev.twitch.tv/console で取得
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# Redis（Phase 2 以降）
# REDIS_URL="redis://localhost:6379"
```

### 4. データベースの起動

Docker Compose で PostgreSQL を起動する。

```bash
docker compose up -d
```

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

## ドキュメント

詳細な設計情報は `docs/` ディレクトリを参照。

| ファイル | 内容 |
|---------|------|
| `docs/00_requirements.md` | 機能要件・ビジネス仕様 |
| `docs/01_architecture.md` | 技術スタック、システム図、技術選定理由 |
| `docs/02_database-design.md` | 完全スキーマ、Prisma モデル、インデックス設計 |
| `docs/05_00_api_overview.md` | API 規約、エラーコード |
| `docs/05_01_api_auth.md` | 認証エンドポイント |
| `docs/05_02_api_users.md` | ユーザー関連エンドポイント |
| `docs/05_03_api_rooms-chat.md` | ルーム／チャット関連エンドポイント + WebSocket イベント |
| `docs/05_04_api_ratings-tags.md` | 評価・タグ関連エンドポイント |
| `docs/06_sitemap.md` | フロントエンドルート構成・画面遷移フロー |

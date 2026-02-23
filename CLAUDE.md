## コードスタイル

- TypeScript strict モード。`any` 型は禁止
- default export ではなく named export を使用
- CSS は Tailwind ユーティリティクラスのみ。カスタム CSS ファイルは作成しない
- コードスタイルは ESLint と Prettier で強制。リンターエラーが出たらその出力に従って修正すること

## コマンド

- `pnpm dev`: 開発サーバー起動（Turbopack、ポート 3000）
- `pnpm test`: Vitest による単体テスト
- `pnpm test:e2e`: Playwright による e2e テスト
- `pnpm lint`: ESLint 実行
- `pnpm db:migrate`: Prisma マイグレーション実行
- `pnpm db:seed`: テストデータ投入

## アーキテクチャ

- `/app`: App Router のページとレイアウト
- `/app/api`: API ルート（すべて`/api/v1`プレフィックス）
- `/components/ui`: 再利用可能な UI コンポーネント
- `/lib`: ユーティリティと共有ロジック
- `/prisma`: データベーススキーマとマイグレーション

## 注意事項

- IMPORTANT: Next.js 16 ではデータ取得がデフォルトでキャッシュされない。静的データには `"use cache"` を明示的に付与すること
- アプリ設計に必要な各種ドキュメントは @docs/ に配置されている。実装前に確認すること。

## ドキュメント一覧

| ファイル                             | 内容                                    |
| -------------------------------- | ------------------------------------- |
| `docs/00_requirements.md`        | 機能要件・ビジネス仕様                           |
| `docs/01_architecture.md`        | 技術スタック、システム図、技術選定理由                   |
| `docs/02_database-design.md`     | 完全スキーマ、Prismaモデル、インデックス設計、マイグレーションSQL |
| `docs/05_00_api_overview.md`     | API規約、エラーコード                          |
| `docs/05_01_api_auth.md`         | 認証エンドポイント                             |
| `docs/05_02_api_users.md`        | ユーザー関連エンドポイント                         |
| `docs/05_03_api_rooms-chat.md`   | ルーム／チャット関連エンドポイント＋WebSocketイベント       |
| `docs/05_04_api_ratings-tags.md` | 評価・タグ関連エンドポイント                        |
| `docs/06_sitemap.md`             | フロントエンドルート構成・画面遷移フロー                  |

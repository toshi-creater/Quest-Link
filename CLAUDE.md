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

## テスト規約
- 単体テスト: Vitest + Testing Library
- E2E: Playwright
- テストファイルの場所: 対象ファイルと同階層に `.test.ts`

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
| `docs/development_procedure.md`             | 実装手順、実装の前に必ず確認すること                  |
| `docs/issue_creation.md`             | issue作成手順、issue作成前に必ず確認すること                  |

## Design Context

デザイン作業の前に必ず参照すること。詳細は `.impeccable.md` を読むこと。

### ユーザー
**日本のカジュアルゲーマー（10〜30代）**。週数回プレイし、今すぐ一緒にゲームできる仲間を手軽に探したい。PC・スマートフォン両対応。

### ブランドパーソナリティ
**3語**: 安心・親しみ・実用

### 目標感情
**安心・信頼感**（最優先）。「知らない人と組む」ハードルを下げること。

### 美的方向性
- **参照**: Steam — 実用的・落ち着いたダーク・ゲームカバーアートが主役
- **現在のダーク×パープルは正しい方向**。ただしネオン・グロー・グラスモーフィズムは抑制する
- **反面教師**: Valorant/Riot 的な攻撃的ビジュアル・AI生成ゲーミングUI

### デザイン原則
1. **信頼を先に** — 第一印象は安全・安心。エネルギーは機能の中に宿らせる
2. **ゲームアートを主役に** — UIはカバー画像の引き立て役
3. **情報の密度を尊重** — 視覚的秩序で読みやすさを確保
4. **スピードの感覚** — アニメーションは速く軽く
5. **平静さの中の個性** — 落ち着いた上での独自性

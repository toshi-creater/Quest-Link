# サイトマップ
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 6.0 | 2026年3月**

---

## 画面一覧

| URL | 画面名 |
|-----|--------|
| `/` | トップ（おすすめ + 部屋一覧） |
| `/games` | ゲーム選択 |
| `/games/[gameId]/rooms` | ゲーム別部屋一覧 |
| `/login` | ログイン |
| `/auth/callback` | OAuth コールバック |
| `/onboarding` | 初回プロフィール設定 |
| `/rooms/new` | 部屋作成 |
| `/rooms/current` | 参加中の部屋詳細 |
| `/rooms/current/chat` | 参加中の部屋チャット |
| `/rooms/[roomId]` | 部屋詳細 |
| `/rooms/[roomId]/guest` | ゲスト参加フロー |
| `/rooms/[roomId]/chat` | チャット |
| `/rooms/[roomId]/ratings` | セッション評価 |
| `/users/me` | 自分のプロフィール |
| `/users/me/edit` | プロフィール編集 |
| `/users/me/history` | 部屋参加履歴 |
| `/users/me/delete` | アカウント削除 |
| `/users/[userId]` | 他ユーザープロフィール |

---

## 画面詳細

### 認証・オンボーディング

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/login` | ログイン | Google ログインボタン表示 | - |
| `/auth/callback` | OAuthコールバック | 認可コードを受け取り JWT を取得・保存。レスポンスの `isNewUser: true` の場合は `/onboarding` へ、既存ユーザーは OAuth `state` に保持した遷移元 URL へリダイレクト | `POST /auth/{provider}/callback`（Google / X / Discord） |
| `/onboarding` | 初回プロフィール設定 | ユーザー名（必須）・アイコン URL・自己紹介・プレイスタイルタグ・プレイゲームを設定。完了後は OAuth `state` に保持した遷移元 URL へリダイレクト。ユーザー名未設定のまま離脱すると部屋機能利用不可（`username: null` の間は参加・作成・チャット不可） | `GET /play-style-tags`（認証不要）、`GET /games/search`、`PATCH /users/me` |

---

### トップ

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/` | トップ | おすすめゲームカテゴリを上段に表示し、部屋一覧を下段に表示するトップページ。ゲームカテゴリを選択すると `/games/{gameId}/rooms` へ遷移。**認証不要**。 | `GET /games/search`（`q` 省略で人気ゲーム一覧取得）、`GET /rooms`（認証不要） |

---

### ゲーム選択

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/games` | ゲーム選択 | マスター登録済みゲームをカード形式（サムネイル＋ゲーム名）でグリッド表示。ゲームを選択すると `/games/{gameId}/rooms` へ遷移。**認証不要**。MVP では20〜30タイトルをフラット表示（ジャンルタブ等の絞り込みは将来対応） | `GET /games/search`（`q` 省略で人気ゲーム一覧取得、認証必要） |

---

### 部屋

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/games/[gameId]/rooms` | ゲーム別部屋一覧 | 選択したゲームで絞り込んだ部屋を新着順で一覧表示（**認証不要で閲覧可**）。フィルター：プレイスタイルタグ（OR 検索）・空き枠あり/なし（`vacant`）・フリーワード（`q`、部屋名・募集文）。URL パラメータでフィルター条件を保持（ブックマーク・共有可）。ログイン済みかつ参加中の部屋がある場合はヘッダーに「参加中の部屋へ」ボタンを表示 | `GET /rooms`（`gameId` パラメータ付き、認証不要）、`GET /rooms/current`（参加中チェック用、ログイン時のみ） |
| `/rooms/current` | 参加中の部屋詳細 | 現在参加中の部屋の詳細を表示。参加中がなければ空状態メッセージを表示。部屋詳細と同様の操作が可能 | `GET /rooms/current` |
| `/rooms/current/chat` | 参加中の部屋チャット | 参加中の部屋のチャット画面に直接アクセス。`GET /rooms/current` で roomId を取得してチャットを表示。参加中の部屋がない場合は `/` へリダイレクト | `GET /rooms/current`、`GET /rooms/{roomId}/messages`、WebSocket `chat:send` / `chat:message` |
| `/rooms/new` | 部屋作成 | タイトル・ゲーム（IGDB連携検索で選択）・最大人数・説明・タグを入力して部屋を作成 | `GET /play-style-tags`、`GET /games/search`、`POST /rooms` |
| `/rooms/[roomId]` | 部屋詳細 | 部屋情報・参加者一覧表示（**認証不要で閲覧可**）、参加 / 退室 / 解散（認証必要）、ホストによる部屋情報編集、SNS シェア、リアルタイム参加者更新（WebSocket）。ログイン済みで自分が参加中の場合は `/rooms/current` へリダイレクト | `GET /rooms/{roomId}`（認証不要）、`POST /rooms/{roomId}/join`、`POST /rooms/{roomId}/leave`、`POST /rooms/{roomId}/close`、`PATCH /rooms/{roomId}`、`POST /rooms/{roomId}/share`、`GET /play-style-tags`（ホスト編集用）、`GET /rooms/current`（自分の参加中部屋かの判定用、ログイン時のみ） |
| `/rooms/[roomId]/guest` | ゲスト参加フロー | 募集リンク経由でアクセスした未ログインユーザー向け。表示名（任意）を入力してゲストセッションを発行し、そのまま部屋に参加。ログインを促すボタンも併設 | `POST /auth/guest`、`POST /rooms/{roomId}/join` |
| `/rooms/[roomId]/chat` | チャット | リアルタイムチャット送受信（WebSocket、ゲスト参加者も利用可）、過去ログのスクロール読み込み（カーソルページネーション） | `GET /rooms/{roomId}/messages`、WebSocket `chat:send` / `chat:message` |
| `/rooms/[roomId]/ratings` | セッション評価 | 部屋クローズ後に同室メンバーを評価（スコア・コメント）、評価期限（24時間）表示 | `GET /rooms/{roomId}/pending-ratings`、`POST /ratings` |

---

### ユーザー

| パス | 画面名 | 主な機能 | 使用 API |
|------|--------|---------|---------|
| `/users/me` | 自分のプロフィール | ユーザー名・アイコン・自己紹介・平均評価・プレイスタイルタグ・プレイゲーム一覧・受け取った評価一覧を表示。未評価セッションがある場合はバナー通知 | `GET /users/me`、`GET /users/{userId}/ratings`、`GET /rooms/{roomId}/pending-ratings`（未評価バナー用） |
| `/users/me/edit` | プロフィール編集 | ユーザー名・アイコン URL・自己紹介・プレイスタイルタグ・プレイゲームを編集（ゲームは IGDB 連携検索で選択、最大20件）。Discord Webhook URL の登録、連携済みプロバイダ（Google / X / Discord）の確認・追加・解除も行う | `GET /play-style-tags`（認証不要）、`GET /games/search`、`GET /games/{gameId}`、`PATCH /users/me`、`POST /auth/{provider}/link`、`DELETE /auth/{provider}/unlink` |
| `/users/me/history` | 参加履歴 | 過去に参加した部屋の一覧をページネーション付きで表示 | `GET /users/me/rooms` |
| `/users/me/delete` | アカウント削除 | 退会の確認・実行（MVP対象） | （退会 API：未定義、要追加） |
| `/users/[userId]` | 他ユーザープロフィール | 他ユーザーのユーザー名・アイコン・自己紹介・平均評価・プレイスタイルタグ・プレイゲーム一覧・受け取った評価一覧を表示（**認証不要**）。評価は完全匿名（評価者非表示） | `GET /users/{userId}`、`GET /users/{userId}/ratings`（いずれも認証不要） |

---

## 画面遷移フロー

```
全ユーザー（ログイン状態問わず）
    └─→ /（トップ）※おすすめゲームカテゴリ上段 + 部屋一覧下段
            └─→ ゲームカテゴリ選択 → /games/{gameId}/rooms（ゲーム別部屋一覧）

    └─→ /games（ゲーム選択）
            └─→ ゲーム選択 → /games/{gameId}/rooms（ゲーム別部屋一覧）

未ログインで「ログイン」クリック / 要認証操作を実行
    └─→ /login
            └─→ Google / X / Discord 認証
                    └─→ /auth/callback（JWT取得）
                            ├─→ 初回ログイン → /onboarding（プロフィール設定）
                            │       └─→ ユーザー名設定完了 → 遷移元 URL へリダイレクト
                            └─→ 既存ユーザー → 遷移元 URL へリダイレクト

/games/[gameId]/rooms（ゲーム別部屋一覧）
    ├─→ /rooms/new（部屋作成）
    │       └─→ 作成成功 → /rooms/[roomId]（部屋詳細）
    │
    ├─→ /rooms/current/chat ボタン（ヘッダー／ログイン済み・参加中のみ表示）
    │       └─→ GET /rooms/current で roomId を取得してチャットを表示
    │               └─→ 参加中なし → /（トップ）へリダイレクト
    │
    └─→ /rooms/[roomId]（部屋詳細）※認証不要で閲覧可
            ├─→ ログイン済みの場合: GET /rooms/current で自分の参加中 roomId を確認
            │       └─→ 一致する場合: そのまま部屋詳細を表示（リダイレクトなし）
            ├─→ 未ログインで「参加する」クリック → /rooms/[roomId]/guest（ゲスト参加フロー）
            │       ├─→ ゲストセッション発行成功 → /rooms/[roomId]/chat（チャット）
            │       └─→ 「ログインして参加」クリック → /login → /rooms/[roomId]
            ├─→ /rooms/[roomId]/chat（チャット）
            │       └─→ ゲスト退室後 → ログイン促進モーダル表示（/login へ誘導）
            └─→ 部屋クローズ後
                    ├─→ ログイン済み → /rooms/[roomId]/ratings（評価画面）
                    │       └─→ 評価完了 or スキップ → /games/[gameId]/rooms（ゲーム別部屋一覧）
                    └─→ ゲスト → ログイン促進モーダル表示（/login へ誘導）

/games/[gameId]/rooms（ゲーム別部屋一覧）
    └─→ /users/[userId]（他ユーザープロフィール）

/users/me（自分のプロフィール）
    └─→ 未評価バナークリック → /rooms/[roomId]/ratings（評価画面）

ヘッダーナビゲーション（全画面共通）
    ├─→ /（トップページ）
    ├─→ /games（部屋を探す）
    ├─→ /rooms/new（部屋を作る）※ログイン必須。未ログイン時はログインモーダル表示
    ├─→ /rooms/current/chat（参加中の部屋）※参加中の部屋がある場合のみ表示
    ├─→ /users/me（プロフィール）※ログイン必須。未ログイン時はログインモーダル表示
    │       ├─→ /users/me/edit（編集）
    │       ├─→ /users/me/history（参加履歴）
    │       └─→ /users/me/delete（アカウント削除）
    │               └─→ 削除完了 → /login
    └─→ ログアウト（POST /auth/logout → /login）
```

---

## WebSocket 接続タイミング

| タイミング | イベント |
|-----------|---------|
| 部屋詳細画面を開く | `room:join` で部屋チャンネルに参加 |
| チャットメッセージ送信 | `chat:send` |
| チャットメッセージ受信 | `chat:message` |
| 他ユーザーの入退室 | `room:user_joined` / `room:user_left` |
| ホスト変更 | `room:host_changed` |
| 部屋解散 | `room:closed` → 評価画面へ遷移 |
| 部屋詳細画面を離れる | `room:leave` で部屋チャンネルから退出 |

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| ver 1.0 | 2026年2月 | 初版作成 |
| ver 2.0 | 2026年2月 | ゲーム API 追加に伴う部屋作成・プロフィール編集の更新、初回オンボーディング画面・アカウント削除画面の追加、未評価バナー遷移の追加 |
| ver 3.0 | 2026年2月 | `GET /rooms/current` 追加に伴う `/rooms/current` 画面・ヘッダー動線の追加、`/rooms/[roomId]` での参加中部屋判定ロジックの追加、`GET /rooms`・`GET /rooms/{roomId}` 認証不要化への対応、部屋ステータスを `waiting` / `full` / `closed` に更新、SNS シェア機能（`POST /rooms/{roomId}/share`）の追加 |
| ver 4.0 | 2026年2月 | ゲスト参加フロー（`/rooms/[roomId]/guest`）の追加、退室後のゲスト向けログイン促進モーダルの追加、認証プロバイダを Google / X / Discord の3種対応に更新、`isNewUser` フラグ対応による初回ログイン判定の明確化、プロバイダ連携管理を `/users/me/edit` に追加、`GET /users/{userId}/ratings`・`GET /play-style-tags` の認証不要化への対応、`/users/[userId]` の認証不要化 |
| ver 5.0 | 2026年2月 | ゲーム選択画面（`/`）を新設しトップ画面に設定、部屋一覧フィルターを `status` 廃止・`vacant`/`q` 追加・タグOR検索に更新、`DELETE /users/me` 追加によるアカウント削除対応、OAuth `state` 経由の遷移元リダイレクト対応 |
| ver 5.1 | 2026年2月 | ヘッダーナビゲーションを整理：ゲーム選択・部屋作成・参加中の部屋チャット・プロフィールの4項目に統一。部屋一覧へのリンクを削除 |
| ver 6.0 | 2026年3月 | URL構造変更：トップ（`/`）をおすすめ＋部屋一覧の複合ページに刷新、ゲーム選択を `/games` に移動、部屋一覧を `/rooms` 廃止・`/games/[gameId]/rooms` に変更。ヘッダーナビゲーションを5項目（トップ・部屋を探す・部屋を作る・参加中の部屋・プロフィール）に更新 |

---

## 備考・要対応事項

| 項目 | 内容 |
|------|------|
| アカウント削除 API | ~~要件定義書では MVP 対象だが、現行の API 設計書に未定義~~ → `DELETE /users/me` が追加されたため解決済み |
| 初回ログイン判定 | ~~`POST /auth/google/callback` のレスポンスで初回ログインかどうかを判別できるフラグが必要~~ → `isNewUser` フラグが追加されたため解決済み |
| ゲストセッションの有効期限 | ゲストセッションは24時間有効。期限切れ後は再発行が必要になるが、同一部屋への再参加フローは未定義のため要検討 |
| プロバイダ連携解除の制約 | 最後の1プロバイダは解除不可（`LAST_PROVIDER` エラー）。`/users/me/edit` の UI では解除ボタンの活性制御が必要 |
| 未評価バナー | `/users/me` での表示に使用する「未評価セッション有無」の取得方法について、全 closed 部屋の `pending-ratings` を個別に呼ぶのか、専用エンドポイントを設けるのかを要検討 |
| SNS シェア（Discord） | ~~`PATCH /users/me` に `discordWebhookUrl` フィールドの追加が必要~~ → `discordWebhookUrl` フィールドが追加されたため解決済み。Discord 投稿はプロフィール登録済みの Webhook URL を使用（1サーバーまで） |
| `/rooms/[roomId]` の参加中判定 | 部屋詳細表示時に `GET /rooms/current` を追加で呼び出すことになる。未ログイン時はスキップし、ログイン済みの場合のみ実行する設計とすること |

---

*以上*

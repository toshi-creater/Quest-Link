# API設計書 — 部屋 API・チャット API・WebSocket
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 2.0 | 2026年2月**

---

## 1. 概要

### エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/rooms` | 不要 | 部屋一覧取得 |
| GET | `/rooms/{roomId}` | 不要 | 部屋詳細取得 |
| GET | `/rooms/current` | 必要 | 自分が参加中の部屋を取得 |
| POST | `/rooms` | 必要 | 部屋作成 |
| PATCH | `/rooms/{roomId}` | 必要（ホストのみ） | 部屋情報更新 |
| POST | `/rooms/{roomId}/join` | 必要 | 部屋に参加 |
| POST | `/rooms/{roomId}/leave` | 必要 | 部屋を退室 |
| POST | `/rooms/{roomId}/close` | 必要（ホストのみ） | 部屋を解散 |
| POST | `/rooms/{roomId}/kick` | 必要（ホストのみ） | 参加者をキック |
| POST | `/rooms/{roomId}/invite` | 必要（ホストのみ） | 招待トークンを取得（冪等。部屋作成時に自動生成済み） |
| POST | `/rooms/{roomId}/share` | 必要 | SNS シェア投稿 |
| GET | `/rooms/{roomId}/messages` | 必要 | チャット履歴取得 |
| GET | `/rooms/{roomId}/pending-ratings` | 必要 | 未評価の相手一覧（`04_ratings-tags.md` 参照） |

### 部屋ステータス

| ステータス | 説明 |
|-----------|------|
| `waiting` | 参加者募集中（デフォルト） |
| `full` | 満員（参加不可・閲覧のみ） |
| `closed` | 解散済み（以降の参加・操作不可） |

### ホスト退室時の挙動

- ログイン済み参加者あり → 入室順が最も早いログイン済み参加者へホストを移譲（`room:host_changed` 発火）
- ログイン済み参加者なし（全員ゲスト または 0人）→ 部屋を `closed` に更新（`room:closed` 発火）

---

## 2. 部屋一覧取得

```
GET /rooms
```

**認証**: 不要 ／ デフォルト `status=waiting`、作成日時降順

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `gameId` | string (UUID) | - | ゲーム ID で絞り込み（ゲーム選択画面から渡す） |
| `tagSlugs` | string | - | slug のカンマ区切り（AND 検索） |
| `vacant` | boolean | - | `true` で空き枠あり（`status=waiting`）の部屋のみ表示 |
| `q` | string | - | 部屋名・募集文のフリーワード検索（100文字以内） |
| `page` | integer | 1 | ページ番号 |
| `limit` | integer | 20 | 件数（最大100） |

`status` パラメータは廃止。`vacant=true` が空き枠フィルターに相当し、デフォルトは全ステータスを返す。

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "770e8400-...",
      "title": "深夜FPS部屋",
      "game": { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverImageUrl": "https://images.igdb.com/..." },
      "maxPlayers": 5,
      "currentPlayers": 3,
      "status": "waiting",
      "playStyleTags": [{ "id": "...", "name": "カジュアル", "slug": "casual" }],
      "host": { "id": "...", "username": "gamer123", "iconUrl": "...", "avgRating": 4.20 },
      "createdAt": "2026-02-20T22:00:00Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

---

## 3. 部屋詳細取得

```
GET /rooms/{roomId}
```

**認証**: 不要（参加前プレビューでログイン不要での閲覧が必要なため）

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "770e8400-...",
    "title": "深夜FPS部屋",
    "game": { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverImageUrl": "https://images.igdb.com/..." },
    "description": "スモーク使える方歓迎！",
    "maxPlayers": 5,
    "currentPlayers": 3,
    "status": "waiting",
    "playStyleTags": [{ "id": "...", "name": "カジュアル", "slug": "casual" }],
    "host": { "id": "...", "username": "gamer123", "iconUrl": "...", "avgRating": 4.20 },
    "participants": [
      { "userId": "...", "username": "gamer123", "iconUrl": "...", "avgRating": 4.20, "isHost": true, "joinedAt": "2026-02-20T22:00:00Z" },
      { "userId": "...", "username": "player456", "iconUrl": "...", "avgRating": 3.80, "isHost": false, "joinedAt": "2026-02-20T22:05:00Z" }
    ],
    "createdAt": "2026-02-20T22:00:00Z",
    "closedAt": null
  }
}
```

`participants` は現在参加中（`left_at IS NULL`）のユーザーのみ返却。`avgRating` は `ratingCount` が5件未満の場合は `null`。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 4. 参加中の部屋を取得

自分が現在参加中（`left_at IS NULL`）の部屋を返す。参加中の部屋がない場合は `data: null` を返す。

```
GET /rooms/current
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "770e8400-...",
    "title": "深夜FPS部屋",
    "game": { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverImageUrl": "https://images.igdb.com/..." },
    "description": "スモーク使える方歓迎！",
    "maxPlayers": 5,
    "currentPlayers": 3,
    "status": "waiting",
    "playStyleTags": [{ "id": "...", "name": "カジュアル", "slug": "casual" }],
    "host": { "id": "...", "username": "gamer123", "iconUrl": "...", "avgRating": 4.20 },
    "participants": [
      { "userId": "...", "username": "gamer123", "iconUrl": "...", "avgRating": 4.20, "isHost": true, "joinedAt": "2026-02-20T22:00:00Z" },
      { "userId": "...", "username": "player456", "iconUrl": "...", "avgRating": 3.80, "isHost": false, "joinedAt": "2026-02-20T22:05:00Z" }
    ],
    "createdAt": "2026-02-20T22:00:00Z",
    "closedAt": null
  }
}
```

参加中の部屋がない場合: `{ "data": null }`

---

## 5. 部屋作成

作成者は自動的にホストとして参加状態になる。

```
POST /rooms
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `title` | string | ○ | 1〜50文字 | 部屋タイトル |
| `gameId` | string (UUID) | ○ | `games.id` | ゲーム（`GET /games` で取得した値） |
| `maxPlayers` | integer | ○ | 2〜16 | 最大参加人数（作成後変更不可） |
| `description` | string | - | 300文字以内 | 部屋の説明 |
| `playStyleTagIds` | string[] | - | 有効なタグ ID | プレイスタイルタグ |

### レスポンス `201 Created`

作成された部屋の詳細（3. と同形式）。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_GAME` | 指定したゲーム ID が存在しない |
| 400 | `INVALID_TAG` | 無効なタグ ID |

---

## 6. 部屋情報更新

ホストのみ実行可能。変更するフィールドのみ送信（部分更新）。`maxPlayers` は変更不可。

```
PATCH /rooms/{roomId}
```

**認証**: 必要（ホストのみ）

### リクエストボディ

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `title` | string | 1〜50文字 | 部屋タイトル |
| `description` | string \| null | 300文字以内 | 部屋の説明（null で削除） |
| `playStyleTagIds` | string[] | 有効なタグ ID | タグ（全件置換） |

### レスポンス `200 OK`

更新後の部屋詳細（3. と同形式）。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_TAG` | 無効なタグ ID |
| 403 | `FORBIDDEN` | ホストではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 7. 部屋に参加

`full` または `closed` の部屋には参加不可。参加成功後に `room:user_joined` が発火。

一覧画面経由はログイン必須。募集リンク経由はゲスト参加可（事前に `POST /auth/guest` でセッションを発行済みであること）。

```
POST /rooms/{roomId}/join
```

**認証**: ログイン済み または ゲストセッション Cookie

### レスポンス `200 OK`

```json
{
  "data": {
    "roomId": "770e8400-...",
    "userId": "660e8400-...",
    "isGuest": false,
    "isHost": false,
    "joinedAt": "2026-02-20T22:05:00Z"
  }
}
```

`isGuest: true` の場合 `userId` はゲスト ID（例: `guest_a1b2c3d4`）。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_CLOSED` | 部屋が解散済み |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |
| 409 | `ALREADY_JOINED` | 既に参加中 |
| 409 | `ROOM_FULL` | 定員に達している |
| 409 | `HOST_CANNOT_JOIN` | 自分がホストの別部屋（未終了）が存在する |

---

## 8. 部屋を退室

退室後に `room:user_left` が発火。ホスト退室時の挙動は「1. 概要」を参照。退室後、ログイン済みは評価画面へ、ゲストはログイン促進画面へ遷移する。

```
POST /rooms/{roomId}/leave
```

**認証**: ログイン済み または ゲストセッション Cookie

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `NOT_IN_ROOM` | 参加していない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 9. 部屋を解散

ホストのみ実行可能。全参加者が退室状態になり `status` が `closed` に更新される。解散後に `room:closed` が発火。参加リンクは即時無効化される。

```
POST /rooms/{roomId}/close
```

**認証**: 必要（ホストのみ）

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_ALREADY_CLOSED` | 既に解散済み |
| 403 | `FORBIDDEN` | ホストではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 10. 招待トークン取得

部屋作成時に自動生成済みのトークンを返す。トークンが存在しない場合（旧データ等）は新規生成する（冪等）。`closed` な部屋には発行不可。

```
POST /rooms/{roomId}/invite
```

**認証**: 必要（ホストのみ）

### レスポンス `200 OK`

```json
{
  "data": {
    "inviteToken": "a3f8c2e1d4b7..."
  }
}
```

招待URLはフロントエンドで `{origin}/rooms/{roomId}?inviteToken={inviteToken}` として構築する。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_CLOSED` | 解散済みの部屋 |
| 403 | `FORBIDDEN` | ホストではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 11. SNS シェア投稿

部屋の参加リンクを X または Discord に投稿する。1部屋・1時間あたり3回まで。

```
POST /rooms/{roomId}/share
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `platforms` | string[] | ○ | 投稿先（`x` / `discord` のいずれか、または両方） |
| `message` | string | - | 投稿本文（省略時は部屋の `description` を使用） |

投稿テンプレート（サーバー側で生成）:
```
【{ゲームタイトル} / {プレイスタイル}】
{message}
残り {残り枠数} 枠 👉 https://questlink.gg/rooms/{roomId}
#QuestLink
```

Discord 投稿はプロフィールに登録済みの `discordWebhookUrl` を使用する。

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `ROOM_CLOSED` | 終了済みの部屋はシェア不可 |
| 400 | `INVALID_WEBHOOK_URL` | Discord Webhook URL が未登録または形式が無効 |
| 403 | `FORBIDDEN` | 部屋の参加者ではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |
| 429 | `SHARE_RATE_LIMIT` | 投稿制限超過（1部屋・1時間あたり3回まで） |

---

## 12. チャット履歴取得

リアルタイム送受信は WebSocket で行い、REST は履歴参照専用。カーソルページネーション方式（`before` パラメータ）を採用。

```
GET /rooms/{roomId}/messages
```

**認証**: 必要

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `before` | string (ISO 8601) | - | この日時より古いメッセージを取得 |
| `limit` | integer | 50 | 件数（最大100） |

### レスポンス `200 OK`

新しい順（`created_at` 降順）で返却。`isSystem: true` の場合 `user` は `null`。

```json
{
  "data": [
    { "id": "...", "roomId": "...", "user": { "id": "...", "username": "gamer123", "iconUrl": "..." }, "content": "よろしくお願いします！", "isSystem": false, "createdAt": "2026-02-20T22:10:00Z" },
    { "id": "...", "roomId": "...", "user": null, "content": "gamer123 が入室しました。", "isSystem": true, "createdAt": "2026-02-20T22:05:00Z" }
  ],
  "meta": { "hasMore": true, "nextCursor": "2026-02-20T22:04:59Z" }
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 403 | `FORBIDDEN` | 部屋の参加者ではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 13. WebSocket イベント

Socket.IO を使用。ログイン済み参加者およびゲスト参加者が利用可。

```javascript
// ログイン済み
const socket = io("wss://api.example.com", { auth: { token: "<accessToken>" } });
// ゲスト（Cookie が自動送信されるため auth 指定不要）
const socket = io("wss://api.example.com");
```

### クライアント → サーバー

| イベント名 | ペイロード | 説明 |
|-----------|----------|------|
| `room:join` | `{ roomId }` | 部屋チャンネルに参加（REST `/join` 後に送信） |
| `room:leave` | `{ roomId }` | 部屋チャンネルから退出（REST `/leave` 後に送信） |
| `chat:send` | `{ roomId, content }` | チャットメッセージを送信 |

### サーバー → クライアント

| イベント名 | ペイロード | 説明 |
|-----------|----------|------|
| `chat:message` | `{ id, roomId, user, content, isSystem, createdAt }` | チャットメッセージ受信 |
| `room:user_joined` | `{ userId, username, iconUrl, avgRating, isGuest, joinedAt }` | ユーザーが入室 |
| `room:user_left` | `{ userId, username, leftAt }` | ユーザーが退室 |
| `room:user_kicked` | `{ kickedUserId, kickedGuestSessionId, byHostId, kickedAt }` | ホストがキック（キックされた本人への強制遷移トリガー） |
| `room:host_changed` | `{ newHostId, newHostUsername }` | ホストが変更 |
| `room:closed` | `{ roomId, closedAt }` | 部屋が解散 |

`room:user_joined` でゲストの場合、`isGuest: true`、`iconUrl: null`、`avgRating: null` となる。

---

*以上*

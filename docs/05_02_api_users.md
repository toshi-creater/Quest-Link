# API設計書 — ユーザー API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 2.0 | 2026年2月**

---

## 1. 概要

### エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/users/me` | 必要 | 自分のプロフィール取得 |
| PATCH | `/users/me` | 必要 | 自分のプロフィール更新 |
| POST | `/users/me/avatar` | 必要 | プロフィール画像アップロード |
| DELETE | `/users/me` | 必要 | アカウント削除 |
| GET | `/users/{userId}` | 必要 | ユーザープロフィール取得 |
| GET | `/users/me/rooms` | 必要 | 自分の部屋参加履歴取得 |
| GET | `/users/{userId}/ratings` | 不要 | ユーザーが受け取った評価一覧（`04_ratings-tags.md` 参照） |
| GET | `/users/me/blocks` | 必要 | ブロック済みユーザー一覧取得 |
| POST | `/users/me/blocks` | 必要 | ユーザーをブロック |
| DELETE | `/users/me/blocks/{userId}` | 必要 | ブロック解除 |
| POST | `/reports` | 必要 | ユーザー・メッセージを通報 |

---

## 2. 自分のプロフィール取得

```
GET /users/me
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "gamer123",
    "iconUrl": "https://example.com/icon.png",
    "bio": "FPSが大好きです。",
    "avgRating": 4.20,
    "ratingCount": 15,
    "games": [
      { "id": "...", "igdbId": 1372, "name": "Apex Legends", "coverImageUrl": "https://images.igdb.com/..." }
    ],
    "linkedProviders": ["google", "discord"],
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `games` | array | プレイしているゲーム一覧（最大20件） |
| `linkedProviders` | string[] | 連携済みプロバイダ一覧（`google` / `x` / `discord`） |


---

## 3. 自分のプロフィール更新

変更するフィールドのみ送信（部分更新）。

```
PATCH /users/me
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `username` | string | 1〜50文字 | 表示名 |
| `iconUrl` | string \| null | URL形式 | アイコン画像 URL |
| `bio` | string \| null | 500文字以内 | 自己紹介文 |
| `gameIds` | string[] | `games.id`、最大20件 | プレイしているゲーム（全件置換） |
| `playStyleTagIds` | string[] | `play-style-tags.id` | プレイスタイルタグ（全件置換） |

### レスポンス `200 OK`

更新後のプロフィールを返す（2. と同形式）。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_GAME` | 存在しないゲーム ID |
| 400 | `TOO_MANY_GAMES` | ゲームが上限（20件）超過 |
| 409 | `USERNAME_TAKEN` | ユーザー名が既に使用中 |

---

## 4. プロフィール画像アップロード

画像ファイルをアップロードし、Supabase Storage に保存した上で `iconUrl` を更新する。

```
POST /users/me/avatar
```

**認証**: 必要
**Content-Type**: `multipart/form-data`

### リクエストボディ

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `file` | File | JPEG / PNG / WebP / GIF、5MB 以内 | アップロードする画像ファイル |

### レスポンス `200 OK`

```json
{
  "data": {
    "iconUrl": "https://xxxx.supabase.co/storage/v1/object/public/avatar_images/user-id/avatar.png"
  }
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `FILE_REQUIRED` | ファイルが含まれていない |
| 400 | `INVALID_FILE_TYPE` | 許可されていない MIME タイプ |
| 400 | `FILE_TOO_LARGE` | ファイルサイズが 5MB 超 |
| 500 | `UPLOAD_FAILED` | Supabase Storage へのアップロード失敗 |

---

## 5. アカウント削除

アカウントおよびすべての関連データを物理削除する。

```
DELETE /users/me
```

**認証**: 必要

### レスポンス `204 No Content`

---

## 6. ユーザープロフィール取得

```
GET /users/{userId}
```

**認証**: 必要

`linkedProviders` は返却しない。評価スコアは `ratingCount` が5件未満の場合は `avgRating: null` を返す。

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "username": "player456",
    "iconUrl": "https://example.com/icon2.png",
    "bio": "Apex Legendsプレデター目指してます。",
    "avgRating": 4.80,
    "ratingCount": 32,
    "games": [
      { "id": "...", "igdbId": 1372, "name": "Apex Legends", "coverImageUrl": "https://images.igdb.com/..." }
    ],
    "isBlocked": false,
    "isMe": false,
    "createdAt": "2026-01-15T00:00:00Z"
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `isBlocked` | boolean | 自分がこのユーザーをブロック済みか（`isMe: true` の場合は常に `false`） |
| `isMe` | boolean | 閲覧中のユーザーが自分自身かどうか |

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 404 | `USER_NOT_FOUND` | ユーザーが存在しない |

---

## 7. 自分の参加履歴取得

新しい順（`joined_at` 降順）で返却される。

```
GET /users/me/rooms
```

**認証**: 必要

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `page` | integer | 1 | ページ番号 |
| `limit` | integer | 20 | 件数（最大100） |

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "roomId": "770e8400-...",
      "title": "深夜FPS部屋",
      "game": { "id": "...", "name": "VALORANT", "coverImageUrl": "https://images.igdb.com/..." },
      "status": "closed",
      "isHost": false,
      "joinedAt": "2026-02-01T22:00:00Z",
      "leftAt": "2026-02-02T00:30:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

---

## 8. ブロック済みユーザー一覧取得

```
GET /users/me/blocks
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "blockedId": "660e8400-e29b-41d4-a716-446655440001",
      "username": "blocked_user",
      "iconUrl": "https://example.com/icon.png",
      "createdAt": "2026-05-28T10:00:00Z"
    }
  ]
}
```

---

## 9. ユーザーをブロック

```
POST /users/me/blocks
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `userId` | string (UUID) | ○ | ブロック対象のユーザー ID |

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_REQUEST` | ユーザー ID が指定されていない |
| 400 | `CANNOT_BLOCK_SELF` | 自分自身をブロックできない |
| 404 | `USER_NOT_FOUND` | ユーザーが存在しない |
| 409 | `ALREADY_BLOCKED` | 既にブロック済み |

---

## 10. ブロック解除

```
DELETE /users/me/blocks/{userId}
```

**認証**: 必要

### レスポンス `204 No Content`

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 404 | `NOT_BLOCKED` | ブロックしていない |

---

## 11. ユーザー・メッセージ通報

ユーザーまたはメッセージを通報する。`targetUserId` と `targetMessageId` のいずれか一方を指定する必要がある。

```
POST /reports
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `targetUserId` | string (UUID) | △ | 通報対象のユーザー ID（`targetMessageId` と排他） |
| `targetMessageId` | string (UUID) | △ | 通報対象のメッセージ ID（`targetUserId` と排他） |
| `reason` | string | ○ | 通報理由（`harassment` / `spam` / `hate_speech` / `inappropriate_content` / `other`） |
| `detail` | string | △ | 詳細コメント（`reason: "other"` の場合は必須、最大 500 文字） |

### レスポンス `201 Created`

```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-05-30T10:00:00Z"
  }
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_REQUEST` | 通報対象が指定されていない |
| 400 | `INVALID_REASON` | 通報理由が無効 |
| 400 | `CANNOT_REPORT_SELF` | 自分自身を通報できない |
| 404 | `USER_NOT_FOUND` | 通報対象ユーザーが存在しない |
| 404 | `MESSAGE_NOT_FOUND` | 通報対象メッセージが存在しない |

---

*以上*

# API設計書 — ユーザー API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [自分のプロフィール取得](#2-自分のプロフィール取得)
3. [自分のプロフィール更新](#3-自分のプロフィール更新)
4. [ユーザープロフィール取得（他ユーザー）](#4-ユーザープロフィール取得他ユーザー)
5. [自分の参加履歴取得](#5-自分の参加履歴取得)

---

## 1. 概要

### 1.1 エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/users/me` | 必要 | 自分のプロフィール取得 |
| PATCH | `/users/me` | 必要 | 自分のプロフィール更新 |
| GET | `/users/{userId}` | 必要 | 他ユーザーのプロフィール取得 |
| GET | `/users/me/rooms` | 必要 | 自分の部屋参加履歴取得 |
| GET | `/users/{userId}/ratings` | 必要 | ユーザーが受け取った評価一覧取得（`04_ratings-tags.md` 参照） |

---

## 2. 自分のプロフィール取得

ログイン中のユーザー自身のプロフィール情報を取得する。

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
    "playStyleTags": [
      { "id": "...", "name": "ガチ勢", "slug": "hardcore" },
      { "id": "...", "name": "深夜勢", "slug": "late_night" }
    ],
    "games": [
      { "id": "...", "igdbId": 1372, "name": "Apex Legends", "coverUrl": "https://images.igdb.com/..." },
      { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverUrl": "https://images.igdb.com/..." }
    ],
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string (UUID) | ユーザー ID |
| `username` | string | 表示名 |
| `iconUrl` | string \| null | アイコン画像 URL |
| `bio` | string \| null | 自己紹介文 |
| `avgRating` | number | 平均評価スコア（0.00〜5.00） |
| `ratingCount` | integer | 受け取った評価の累計件数 |
| `playStyleTags` | array | 設定中のプレイスタイルタグ |
| `games` | array | プレイしているゲーム一覧（最大20件） |
| `createdAt` | string (ISO 8601) | アカウント作成日時 |

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 401 | `UNAUTHORIZED` | 認証トークンが無効または期限切れ |

---

## 3. 自分のプロフィール更新

ログイン中のユーザー自身のプロフィールを更新する。変更するフィールドのみ送信すること（部分更新）。

```
PATCH /users/me
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `username` | string | - | 1〜50文字、ユニーク | 表示名 |
| `iconUrl` | string \| null | - | URL 形式 または null | アイコン画像 URL |
| `bio` | string \| null | - | 500文字以内 または null | 自己紹介文 |
| `playStyleTagIds` | string[] | - | 有効なタグ ID の配列 | プレイスタイルタグ（**全件置換**） |
| `gameIds` | string[] | - | `games.id` の配列、最大20件 | プレイしているゲーム（**全件置換**） |

```json
{
  "username": "new_gamer",
  "bio": "Apex Legendsメインです。",
  "playStyleTagIds": [
    "tag-uuid-1",
    "tag-uuid-2"
  ],
  "gameIds": [
    "game-uuid-1",
    "game-uuid-2"
  ]
}
```

> `playStyleTagIds` を指定すると、既存のタグがすべて置き換えられる。タグを全削除する場合は空配列 `[]` を送信する。

> `gameIds` を指定すると、既存のゲームがすべて置き換えられる。ゲームを全削除する場合は空配列 `[]` を送信する。`gameIds` には `GET /games/search` または `GET /games/{gameId}` で取得した `id`（UUID）を使用する。

### レスポンス `200 OK`

更新後のプロフィールを返す（「2. 自分のプロフィール取得」と同形式）。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `INVALID_TAG` | 存在しないまたは無効な（`is_active = false`）タグ ID が指定された |
| 400 | `INVALID_GAME` | 存在しないゲーム ID が指定された |
| 400 | `TOO_MANY_GAMES` | ゲームの登録数が上限（20件）を超えている |
| 409 | `USERNAME_TAKEN` | ユーザー名が既に他のユーザーに使用されている |

---

## 4. ユーザープロフィール取得（他ユーザー）

指定したユーザーのプロフィールを取得する。

```
GET /users/{userId}
```

**認証**: 必要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `userId` | string (UUID) | 取得対象のユーザー ID |

### レスポンス `200 OK`

「2. 自分のプロフィール取得」と同形式。全フィールドが返却される。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `USER_NOT_FOUND` | 指定した ID のユーザーが存在しない |

---

## 5. 自分の参加履歴・参加中の部屋取得

ログイン中のユーザーの部屋参加情報を取得する。新しい順（`joined_at` 降順）で返却される。

`active=true` を指定すると現在参加中（`left_at IS NULL`）の部屋のみを返す。ユーザーが同時に参加できる部屋は1つまでのため、`active=true` の場合は最大1件が返却される。

```
GET /users/me/rooms
```

**認証**: 必要

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `active` | boolean | `false` | `true` の場合、現在参加中（`left_at IS NULL`）の部屋のみ返す（最大1件） |
| `page` | integer | 1 | ページ番号（`active=false` のみ有効） |
| `limit` | integer | 20 | 件数（最大100、`active=false` のみ有効） |

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "roomId": "770e8400-e29b-41d4-a716-446655440002",
      "title": "深夜FPS部屋",
      "gameTitle": "Valorant",
      "status": "closed",
      "isHost": false,
      "joinedAt": "2026-02-01T22:00:00Z",
      "leftAt": "2026-02-02T00:30:00Z"
    },
    {
      "roomId": "880e8400-e29b-41d4-a716-446655440003",
      "title": "Apex ランク部屋",
      "gameTitle": "Apex Legends",
      "status": "closed",
      "isHost": true,
      "joinedAt": "2026-01-28T21:00:00Z",
      "leftAt": "2026-01-28T23:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `roomId` | string (UUID) | 部屋 ID |
| `title` | string | 部屋タイトル |
| `gameTitle` | string | ゲームタイトル |
| `status` | string | 部屋ステータス（`waiting` / `playing` / `closed`） |
| `isHost` | boolean | ホストとして参加していたか |
| `joinedAt` | string (ISO 8601) | 入室日時 |
| `leftAt` | string \| null (ISO 8601) | 退室日時（`null` = 現在参加中） |

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 401 | `UNAUTHORIZED` | 認証トークンが無効または期限切れ |

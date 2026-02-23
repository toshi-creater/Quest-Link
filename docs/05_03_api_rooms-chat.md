# API設計書 — 部屋 API・チャット API・WebSocket
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [部屋一覧取得](#2-部屋一覧取得)
3. [部屋詳細取得](#3-部屋詳細取得)
4. [部屋作成](#4-部屋作成)
5. [部屋情報更新](#5-部屋情報更新)
6. [部屋に参加](#6-部屋に参加)
7. [部屋を退室](#7-部屋を退室)
8. [部屋を解散](#8-部屋を解散)
9. [チャット履歴取得](#9-チャット履歴取得)
10. [WebSocket イベント](#10-websocket-イベント)

---

## 1. 概要

### エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/rooms` | 必要 | 部屋一覧取得 |
| GET | `/rooms/{roomId}` | 必要 | 部屋詳細取得 |
| POST | `/rooms` | 必要 | 部屋作成 |
| PATCH | `/rooms/{roomId}` | 必要（ホストのみ） | 部屋情報更新 |
| POST | `/rooms/{roomId}/join` | 必要 | 部屋に参加 |
| POST | `/rooms/{roomId}/leave` | 必要 | 部屋を退室 |
| POST | `/rooms/{roomId}/close` | 必要（ホストのみ） | 部屋を解散 |
| GET | `/rooms/{roomId}/messages` | 必要 | チャット履歴取得 |
| GET | `/rooms/{roomId}/pending-ratings` | 必要 | 未評価の相手一覧（`04_ratings-tags.md` 参照） |

### 部屋ステータス

| ステータス | 説明 |
|-----------|------|
| `waiting` | 参加者募集中（デフォルト） |
| `playing` | ゲーム進行中 |
| `closed` | 解散済み（以降の参加・操作不可） |

### ホスト退室時の挙動

- 残余参加者あり → 入室順が最も早い参加者へホストを移譲（`room:host_changed` 発火）
- 残余参加者なし → 部屋を `closed` に更新（`room:closed` 発火）

---

## 2. 部屋一覧取得

```
GET /rooms
```

**認証**: 必要 ／ デフォルト `status=waiting`、作成日時降順

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `status` | string | `waiting` | `waiting` / `playing` / `closed` |
| `gameId` | string (UUID) | - | ゲーム ID で絞り込み（完全一致） |
| `tagSlugs` | string | - | slug のカンマ区切り（AND 検索） |
| `page` | integer | 1 | ページ番号 |
| `limit` | integer | 20 | 件数（最大100） |

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "770e8400-...",
      "title": "深夜FPS部屋",
      "game": { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverUrl": "https://images.igdb.com/..." },
      "maxPlayers": 5,
      "currentPlayers": 3,
      "status": "waiting",
      "playStyleTags": [{ "id": "...", "name": "ガチ勢", "slug": "hardcore" }],
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

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "770e8400-...",
    "title": "深夜FPS部屋",
    "game": { "id": "...", "igdbId": 126459, "name": "VALORANT", "coverUrl": "https://images.igdb.com/..." },
    "description": "スモーク使える方歓迎！",
    "maxPlayers": 5,
    "currentPlayers": 3,
    "status": "waiting",
    "playStyleTags": [{ "id": "...", "name": "ガチ勢", "slug": "hardcore" }],
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

`participants` は現在参加中（`left_at IS NULL`）のユーザーのみ返却。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 4. 部屋作成

作成者は自動的にホストとして参加状態になる。

```
POST /rooms
```

**認証**: 必要

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `title` | string | ○ | 1〜100文字 | 部屋タイトル |
| `gameId` | string (UUID) | ○ | `games.id` | ゲーム ID（`GET /games/search` で取得した値を使用） |
| `maxPlayers` | integer | ○ | 2〜16 | 最大参加人数 |
| `description` | string | - | - | 部屋の説明 |
| `playStyleTagIds` | string[] | - | 有効なタグ ID | プレイスタイルタグ |

### レスポンス `201 Created`

作成された部屋の詳細（3. と同形式）。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `INVALID_GAME` | 指定したゲーム ID が存在しない |
| 400 | `INVALID_TAG` | 無効なタグ ID |

---

## 5. 部屋情報更新

ホストのみ実行可能。変更するフィールドのみ送信（部分更新）。`status` / `maxPlayers` は変更不可。

```
PATCH /rooms/{roomId}
```

**認証**: 必要（ホストのみ）

### リクエストボディ

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| `title` | string | 1〜100文字 | 部屋タイトル |
| `description` | string \| null | - | 部屋の説明（null で削除） |
| `playStyleTagIds` | string[] | 有効なタグ ID | タグ（全件置換） |

### レスポンス `200 OK`

更新後の部屋詳細（3. と同形式）。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `INVALID_TAG` | 無効なタグ ID |
| 403 | `FORBIDDEN` | ホストではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 6. 部屋に参加

満員または `closed` の部屋には参加不可。参加成功後に `room:user_joined` が発火。

```
POST /rooms/{roomId}/join
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": {
    "roomId": "770e8400-...",
    "userId": "660e8400-...",
    "isHost": false,
    "joinedAt": "2026-02-20T22:05:00Z"
  }
}
```

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `ROOM_CLOSED` | 部屋が解散済み |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |
| 409 | `ALREADY_JOINED` | 既に参加中 |
| 409 | `ROOM_FULL` | 定員に達している |

---

## 7. 部屋を退室

退室後に `room:user_left` が発火。ホスト退室時の挙動は「1. 概要」を参照。

```
POST /rooms/{roomId}/leave
```

**認証**: 必要

### レスポンス `204 No Content`

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `NOT_IN_ROOM` | 参加していない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 8. 部屋を解散

ホストのみ実行可能。全参加者が退室状態になり `status` が `closed` に更新される。解散後に `room:closed` が発火。

```
POST /rooms/{roomId}/close
```

**認証**: 必要（ホストのみ）

### レスポンス `204 No Content`

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `ROOM_ALREADY_CLOSED` | 既に解散済み |
| 403 | `FORBIDDEN` | ホストではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 9. チャット履歴取得

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

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 403 | `FORBIDDEN` | 部屋の参加者ではない |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 10. WebSocket イベント

Socket.IO を使用。接続時に JWT 認証が必要。

```javascript
const socket = io("wss://api.example.com", { auth: { token: "<accessToken>" } });
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
| `room:user_joined` | `{ userId, username, iconUrl, avgRating, joinedAt }` | ユーザーが入室 |
| `room:user_left` | `{ userId, username, leftAt }` | ユーザーが退室 |
| `room:host_changed` | `{ newHostId, newHostUsername }` | ホストが変更 |
| `room:closed` | `{ roomId, closedAt }` | 部屋が解散 |

# API設計書 — 評価 API・プレイスタイルタグ API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 2.0 | 2026年2月**

---

## 1. 概要

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | `/rooms/{roomId}/ratings` | 必要 | 評価を送信 |
| GET | `/users/{userId}/ratings` | 不要 | ユーザーが受け取った評価一覧 |
| GET | `/rooms/{roomId}/pending-ratings` | 必要 | 未評価の相手一覧 |
| GET | `/play-style-tags` | 不要 | 有効なタグ一覧取得 |
| GET | `/games/{gameId}/tags` | 不要 | ゲームタグ一覧 |

---

## 2. 評価を送信

セッション終了後、同じ部屋に参加していたユーザーを評価する。

```
POST /rooms/{roomId}/ratings
```

**認証**: 必要

### 制約

| 項目 | 内容 |
|------|------|
| 評価期限 | 部屋が `closed` になってから24時間以内 |
| 評価回数 | 同一セッション・同一ペアで1回のみ |
| 自己評価 | 禁止 |
| スコア範囲 | 1〜5 の整数 |
| 参加条件 | 評価者・被評価者ともに対象の部屋に参加していたこと |
| ゲスト | 評価の送受信対象外（ログイン済みユーザー間のみ） |

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `revieweeId` | string (UUID) | ○ | 自分以外 | 評価対象ユーザーの ID |
| `score` | integer | ○ | 1〜5 | 評価スコア |
| `comment` | string | - | - | 任意コメント（匿名） |

### レスポンス `201 Created`

```json
{
  "data": {
    "id": "rating-uuid-1",
    "roomId": "770e8400-...",
    "revieweeId": "660e8400-...",
    "score": 5,
    "comment": "また一緒にやりましょう！",
    "createdAt": "2026-02-20T23:00:00Z",
    "expiresAt": "2026-02-21T23:00:00Z"
  }
}
```

評価送信後、被評価者の `avg_rating` と `rating_count` がトランザクション内で更新される。

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 400 | `INVALID_SCORE` | スコアが 1〜5 の範囲外 |
| 400 | `SELF_RATING` | 自己評価は禁止 |
| 400 | `RATING_EXPIRED` | 評価受付期限（24時間）を過ぎている |
| 403 | `NOT_PARTICIPATED` | 対象の部屋に参加していなかった |
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |
| 404 | `USER_NOT_FOUND` | 評価対象ユーザーが存在しない |
| 409 | `ALREADY_RATED` | 既に評価済み |

---

## 3. 受け取った評価一覧取得

```
GET /users/{userId}/ratings
```

**認証**: 不要（プロフィールページでログイン不要での閲覧が必要なため）

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `page` | integer | 1 | ページ番号 |
| `limit` | integer | 20 | 件数（最大100） |

### レスポンス `200 OK`

評価は完全匿名のため `reviewer` は返却しない。

```json
{
  "data": [
    {
      "id": "rating-uuid-1",
      "roomId": "770e8400-...",
      "score": 5,
      "comment": "また一緒にやりましょう！",
      "createdAt": "2026-02-20T23:00:00Z"
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20 }
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 404 | `USER_NOT_FOUND` | ユーザーが存在しない |

---

## 4. 未評価の相手一覧取得

部屋クローズ後に、自分がまだ評価していない同室参加者の一覧を返す。評価期限を超えた場合は空配列を返す。

```
GET /rooms/{roomId}/pending-ratings
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "userId": "660e8400-...",
      "username": "player456",
      "iconUrl": "https://example.com/icon2.png",
      "avgRating": 3.80,
      "expiresAt": "2026-02-21T23:00:00Z"
    }
  ]
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 5. プレイスタイルタグ一覧取得

`is_active = true` のタグのみ `display_order` 昇順で返却。

```
GET /play-style-tags
```

**認証**: 不要

### レスポンス `200 OK`

```json
{
  "data": [
    { "id": "...", "name": "ガチ勢", "slug": "hardcore", "displayOrder": 1 },
    { "id": "...", "name": "エンジョイ勢", "slug": "casual", "displayOrder": 2 },
    { "id": "...", "name": "初心者歓迎", "slug": "beginner_friendly", "displayOrder": 3 },
    { "id": "...", "name": "上級者向け", "slug": "advanced", "displayOrder": 4 },
    { "id": "...", "name": "深夜勢", "slug": "late_night", "displayOrder": 5 },
    { "id": "...", "name": "配信者", "slug": "streamer", "displayOrder": 6 }
  ]
}
```

---

## 6. ゲームタグ一覧取得

全ゲーム共通の `play_style_tags` マスターから `is_active = true` のタグを返す。`GET /play-style-tags` と同等だが、フロントが gameId コンテキストで呼べる利便性のために残す。

```
GET /games/{gameId}/tags
```

**認証**: 不要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `gameId` | string (UUID) | `games.id`（DB内部のゲーム ID） |

### レスポンス `200 OK`

```json
{
  "data": [
    { "id": "...", "name": "ガチ勢", "slug": "hardcore", "displayOrder": 1 },
    { "id": "...", "name": "エンジョイ勢", "slug": "casual", "displayOrder": 2 }
  ]
}
```

### エラー

| HTTP | エラーコード | 説明 |
|------|------------|------|
| 404 | `GAME_NOT_FOUND` | 指定した ID のゲームが存在しない |

---

*以上*

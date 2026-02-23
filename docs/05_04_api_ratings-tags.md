# API設計書 — 評価 API・プレイスタイルタグ API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [評価を送信](#2-評価を送信)
3. [受け取った評価一覧取得](#3-受け取った評価一覧取得)
4. [未評価の相手一覧取得](#4-未評価の相手一覧取得)
5. [プレイスタイルタグ一覧取得](#5-プレイスタイルタグ一覧取得)

---

## 1. 概要

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | `/ratings` | 必要 | 評価を送信 |
| GET | `/users/{userId}/ratings` | 必要 | ユーザーが受け取った評価一覧 |
| GET | `/rooms/{roomId}/pending-ratings` | 必要 | 未評価の相手一覧 |
| GET | `/play-style-tags` | 必要 | 有効なタグ一覧取得 |

---

## 2. 評価を送信

セッション終了後、同じ部屋に参加していたユーザーを評価する。

```
POST /ratings
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

### リクエストボディ

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `roomId` | string (UUID) | ○ | - | 対象セッションの部屋 ID |
| `revieweeId` | string (UUID) | ○ | 自分以外 | 評価対象ユーザーの ID |
| `score` | integer | ○ | 1〜5 | 評価スコア |
| `comment` | string | - | 任意 | 任意コメント |

```json
{
  "roomId": "770e8400-e29b-41d4-a716-446655440002",
  "revieweeId": "660e8400-e29b-41d4-a716-446655440001",
  "score": 5,
  "comment": "また一緒にやりましょう！"
}
```

### レスポンス `201 Created`

```json
{
  "data": {
    "id": "rating-uuid-1",
    "roomId": "770e8400-e29b-41d4-a716-446655440002",
    "revieweeId": "660e8400-e29b-41d4-a716-446655440001",
    "score": 5,
    "comment": "また一緒にやりましょう！",
    "createdAt": "2026-02-20T23:00:00Z",
    "expiresAt": "2026-02-21T23:00:00Z"
  }
}
```

> 評価送信後、サーバー側で被評価者の `avg_rating` と `rating_count` がトランザクション内で更新される。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 400 | `INVALID_SCORE` | スコアが 1〜5 の範囲外 |
| 400 | `SELF_RATING` | 自己評価は禁止 |
| 400 | `RATING_EXPIRED` | 評価受付期限（24時間）を過ぎている |
| 403 | `NOT_PARTICIPATED` | 評価者または被評価者が対象の部屋に参加していなかった |
| 404 | `ROOM_NOT_FOUND` | 指定した部屋が存在しない |
| 404 | `USER_NOT_FOUND` | 評価対象ユーザーが存在しない |
| 409 | `ALREADY_RATED` | 同一セッション・同一ペアで既に評価済み |

---

## 3. 受け取った評価一覧取得

指定したユーザーが受け取った評価の一覧を取得する。新しい順（`created_at` 降順）で返却される。

```
GET /users/{userId}/ratings
```

**認証**: 必要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `userId` | string (UUID) | 対象ユーザーの ID |

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
      "id": "rating-uuid-1",
      "roomId": "770e8400-e29b-41d4-a716-446655440002",
      "reviewer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "gamer123",
        "iconUrl": "https://example.com/icon.png"
      },
      "score": 5,
      "comment": "また一緒にやりましょう！",
      "createdAt": "2026-02-20T23:00:00Z"
    },
    {
      "id": "rating-uuid-2",
      "roomId": "880e8400-e29b-41d4-a716-446655440003",
      "reviewer": {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "username": "player789",
        "iconUrl": "https://example.com/icon3.png"
      },
      "score": 4,
      "comment": null,
      "createdAt": "2026-02-18T20:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `reviewer` | object | 評価したユーザーの情報 |
| `score` | integer | 評価スコア（1〜5） |
| `comment` | string \| null | コメント（任意項目のため null の場合あり） |

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `USER_NOT_FOUND` | 指定した ID のユーザーが存在しない |

---

## 4. 未評価の相手一覧取得

部屋クローズ後に、ログインユーザーがまだ評価していない同室参加者の一覧を返す。

```
GET /rooms/{roomId}/pending-ratings
```

**認証**: 必要

評価期限（`expires_at`）を超えた場合は空配列 `[]` を返す。クライアントはこのエンドポイントを使って評価 UI に表示する対象を取得する。

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `roomId` | string (UUID) | 部屋 ID |

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "userId": "660e8400-e29b-41d4-a716-446655440001",
      "username": "player456",
      "iconUrl": "https://example.com/icon2.png",
      "avgRating": 3.80,
      "expiresAt": "2026-02-21T23:00:00Z"
    },
    {
      "userId": "990e8400-e29b-41d4-a716-446655440004",
      "username": "player789",
      "iconUrl": "https://example.com/icon3.png",
      "avgRating": 4.50,
      "expiresAt": "2026-02-21T23:00:00Z"
    }
  ]
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `userId` | string (UUID) | 評価対象ユーザーの ID |
| `username` | string | 表示名 |
| `iconUrl` | string \| null | アイコン画像 URL |
| `avgRating` | number | 現在の平均評価スコア |
| `expiresAt` | string (ISO 8601) | 評価受付期限 |

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `ROOM_NOT_FOUND` | 部屋が存在しない |

---

## 5. プレイスタイルタグ一覧取得

ユーザーや部屋に設定できるプレイスタイルタグの一覧を取得する。`is_active = true` のタグのみ返却され、`display_order` の昇順で並ぶ。

```
GET /play-style-tags
```

**認証**: 必要

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "tag-uuid-1",
      "name": "ガチ勢",
      "slug": "hardcore",
      "displayOrder": 1
    },
    {
      "id": "tag-uuid-2",
      "name": "エンジョイ勢",
      "slug": "casual",
      "displayOrder": 2
    },
    {
      "id": "tag-uuid-3",
      "name": "初心者歓迎",
      "slug": "beginner_friendly",
      "displayOrder": 3
    },
    {
      "id": "tag-uuid-4",
      "name": "上級者向け",
      "slug": "advanced",
      "displayOrder": 4
    },
    {
      "id": "tag-uuid-5",
      "name": "深夜勢",
      "slug": "late_night",
      "displayOrder": 5
    },
    {
      "id": "tag-uuid-6",
      "name": "配信者",
      "slug": "streamer",
      "displayOrder": 6
    }
  ]
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string (UUID) | タグ ID（ユーザー・部屋の更新 API で使用） |
| `name` | string | タグの表示名 |
| `slug` | string | URL・コード用の識別子（部屋一覧の絞り込みに使用） |
| `displayOrder` | integer | UI 表示順 |

> `is_active = false` のタグは返却されない。廃止タグに紐づいた既存の設定はそのまま保持されるが、新規選択はできなくなる。

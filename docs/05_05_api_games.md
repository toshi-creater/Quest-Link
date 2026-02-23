# API設計書 — ゲーム API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [ゲーム検索](#2-ゲーム検索)
3. [ゲーム詳細取得](#3-ゲーム詳細取得)

---

## 1. 概要

### 1.1 ゲームデータの取得元

ゲーム情報は **IGDB API**（Twitch Developer が提供するゲームデータベース）から取得する。バックエンドは受け取ったゲーム情報を `games` テーブルにキャッシュし、次回以降の同一クエリにはキャッシュから返す。IGDB APIへのリクエストはバックエンド経由でのみ行い、クライアントが IGDB に直接アクセスすることはない。

### 1.2 利用シーン

| シーン | 説明 |
|--------|------|
| 部屋作成 | `POST /rooms` の `gameId` に設定するゲームを選択する際に使用 |
| プロフィール編集 | `PATCH /users/me` の `gameIds` に設定するゲームを選択する際に使用 |

### 1.3 エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/games/search` | 必要 | キーワードによるゲーム検索 |
| GET | `/games/{gameId}` | 必要 | ゲーム詳細取得（ID指定） |

### 1.4 ゲームオブジェクト（共通）

各エンドポイントで返却されるゲームの基本オブジェクト形式。

```json
{
  "id": "game-uuid-1",
  "igdbId": 126459,
  "name": "VALORANT",
  "coverUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string (UUID) | DB内部のゲーム ID。部屋作成・プロフィール更新 API で使用する |
| `igdbId` | integer | IGDB 上のゲーム ID |
| `name` | string | ゲーム名 |
| `coverUrl` | string \| null | カバー画像 URL（IGDB CDN）。未設定の場合は `null` |

---

## 2. ゲーム検索

キーワードをもとに IGDB API を経由してゲームを検索する。結果はバックエンドで `games` テーブルにキャッシュされる。

```
GET /games/search
```

**認証**: 必要

### クエリパラメータ

| パラメータ | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `q` | string | ○ | 1〜100文字 | 検索キーワード（ゲーム名の前方一致・部分一致） |
| `limit` | integer | - | 1〜20、デフォルト10 | 取得件数 |

```
GET /games/search?q=Apex&limit=5
```

### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "game-uuid-1",
      "igdbId": 1372,
      "name": "Apex Legends",
      "coverUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/co3okb.jpg"
    },
    {
      "id": "game-uuid-2",
      "igdbId": 119171,
      "name": "Apex Legends Mobile",
      "coverUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/co5esv.jpg"
    }
  ]
}
```

> ページネーションは設けない。検索候補の提示（オートコンプリート用途）を想定しているため、最大20件で十分と判断する。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 500 | `IGDB_ERROR` | IGDB API との通信に失敗 |

---

## 3. ゲーム詳細取得

DB内部の UUID を指定してゲームの詳細情報を取得する。部屋作成フォームや評価画面など、すでに `gameId` が既知の状況でゲーム情報を再取得する際に使用する。

```
GET /games/{gameId}
```

**認証**: 必要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `gameId` | string (UUID) | `games.id`（DB内部のゲーム ID） |

### レスポンス `200 OK`

```json
{
  "data": {
    "id": "game-uuid-1",
    "igdbId": 1372,
    "name": "Apex Legends",
    "coverUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/co3okb.jpg"
  }
}
```

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `NOT_FOUND` | 指定した ID のゲームが存在しない |

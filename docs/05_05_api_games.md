# API設計書 — ゲーム API
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.0 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [ゲーム検索](#2-ゲーム検索)
3. [ゲーム詳細取得](#3-ゲーム詳細取得)
4. [ゲームに紐づく部屋一覧取得](#4-ゲームに紐づく部屋一覧取得)

---

## 1. 概要

### 1.1 ゲームデータの取得元

ゲーム情報は **IGDB API**（Twitch Developer が提供するゲームデータベース）から取得する。バックエンドは受け取ったゲーム情報を `games` テーブルにキャッシュし、次回以降の同一クエリにはキャッシュから返す。IGDB APIへのリクエストはバックエンド経由でのみ行い、クライアントが IGDB に直接アクセスすることはない。

取得時は以下の処理でデータ品質を保証する。

- IGDB クエリに `version_parent = null & parent_game = null` フィルタを適用し、版違い（エディション等）・エピソード・シーズン・DLC を除外する
- 同一名称のゲームが複数返却された場合、`updated_at` が最新の1件のみを残す

> 例：「Call of Duty: WWII」と「Call of Duty: Black Ops 2」はタイトルが異なるため両方返却される。「Fortnite」のように同名エントリが複数ある場合は最新の1件に絞られる。

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
| GET | `/games/{gameId}/rooms` | 不要 | ゲームでフィルタリングした部屋一覧 |

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
| `q` | string | - | 0〜100文字 | 検索キーワード。省略または空文字の場合は人気ゲームを返す |
| `limit` | integer | - | 1〜20、デフォルト10 | 取得件数 |

> **`q` 省略時の動作**: IGDB の総評価数（`total_rating_count`）上位ゲームを `limit` 件返す。UI 上のゲーム選択ドロップダウンを開いた初期状態での表示に使用する。

```
GET /games/search?q=Apex&limit=5   # キーワード検索
GET /games/search                  # 人気ゲームをデフォルト10件取得
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
| 400 | `BAD_REQUEST` | `q` が100文字を超えている |
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

---

## 4. ゲームに紐づく部屋一覧取得

指定ゲームでフィルタリングした部屋一覧を返す。`GET /rooms?gameId={gameId}` と等価。

```
GET /games/{gameId}/rooms
```

**認証**: 不要

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `gameId` | string (UUID) | `games.id`（DB内部のゲーム ID） |

### クエリパラメータ

`GET /rooms` と同形式。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `tagSlugs` | string[] | - | タグスラッグでフィルタ（複数指定可） |
| `vacant` | boolean | - | `true` の場合、空きのある部屋のみ |
| `q` | string | - | 部屋名キーワード検索 |
| `page` | integer | 1 | ページ番号 |
| `limit` | integer | 20 | 件数（最大100） |

### レスポンス `200 OK`

`GET /rooms` と同形式。

### エラー

| HTTP ステータス | エラーコード | 説明 |
|--------------|------------|------|
| 404 | `NOT_FOUND` | 指定した ID のゲームが存在しない |

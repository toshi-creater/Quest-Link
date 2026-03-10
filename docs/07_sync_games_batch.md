# Sync Games バッチ要件定義

## 1. バッチ処理概要

### 目的
TwitchおよびIGDBのAPIからQuestLinkで使えるゲームを自動登録する

### フロー

```
1. Twitch API からトップ100件取得
2. igdb_id が空のものは除外
3. igdb_id で IGDB 検索
4. 条件フィルタ（日本語 / マルチプレイ / メインゲーム）
5. DB へ UPSERT
```

### 実行方法

```json
// package.json
{
  "scripts": {
    "batch:games": "ts-node src/batch/syncGames.ts"
  }
}
```

```bash
pnpm batch:games
```

### 実行頻度
1日1回

---

## 2. Twitch 人気ゲーム取得

### API

```
GET https://api.twitch.tv/helix/games/top?first=100
```

### 取得フィールド

| フィールド | 用途 |
|---|---|
| `id` | Twitch ゲームID |
| `igdb_id` | IGDB検索キー |
| `name` | ゲーム名 |

`igdb_id` が空（null / 空文字）のものは以降の処理をスキップする。

---

## 3. IGDB 検索

`igdb_id` を使って検索する。

```
fields
  id,
  name,
  cover.image_id,
  game_modes,
  category,
  language_supports.language.locale,
  genres.name;
where id = {igdb_id};
```

---

## 4. フィルタ条件

```
category == 0
AND language_supports.language.locale contains "ja-JP"
AND game_modes in (2, 3)
```

| 条件 | 意味 |
|---|---|
| `category == 0` | Main Game のみ |
| `locale contains "ja-JP"` | 日本語対応 |
| `game_modes in (2, 3)` | Multiplayer または Co-op |

---

## 5. DB UPSERT

### キー
`igdb_id`

### テーブルスキーマ（最終版）

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `igdb_id` | `INTEGER` | NULL | - | IGDB ゲームID（UPSERTキー） |
| `name` | `VARCHAR(255)` | NOT NULL | - | ゲーム名 |
| `cover_image_url` | `TEXT` | NULL | - | カバー画像URL |
| `genre` | `TEXT[]` | NULL | - | ジャンル配列（例: `["FPS", "RPG"]`） |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | falseでゲーム選択画面から非表示 |
| `display_order` | `SMALLINT` | NOT NULL | `0` | ゲーム選択画面でのグリッド表示順 |
| `cached_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | マスター登録・更新日時 |

### UPSERT 仕様

| フィールド | INSERT | UPDATE |
|---|---|---|
| `igdb_id` | ✅ | キー（変更なし） |
| `name` | ✅ | ✅ |
| `cover_image_url` | ✅ | ✅ |
| `genre` | ✅ | ✅ |
| `is_active` | `true` 固定 | ❌ 保護（手動変更を維持） |
| `display_order` | MAX + 1 で採番 | ❌ 保護（手動変更を維持） |
| `cached_at` | `NOW()` | ✅ `NOW()` に更新 |

### `cover_image_url` の組み立て

IGDBから取得した `cover.image_id` を以下のフォーマットでURLに変換して保存する。

```
https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg
```

### `display_order` の採番ルール（INSERT時のみ）

```
既存レコードの MAX(display_order) + 1 を割り当てる
レコードが0件の場合は 1 から開始
```

---

## 6. 認証トークン管理

- 対象: Twitch API / IGDB API（共通トークン）
- 取得方法: OAuth 2.0 Client Credentials
- 有効期限: 60日
- 管理方針: バッチ実行時に有効期限をチェックし、期限切れの場合は自動再取得する

---

## 7. エラーハンドリング

| ケース | 対応 |
|---|---|
| `igdb_id` が空 | スキップ（ログ不要） |
| IGDB で該当なし | スキップしてログ出力 |
| フィルタ条件を満たさない | スキップ（ログ不要） |
| API レート制限（429） | 一定時間待機後にリトライ（最大3回） |
| API 接続エラー | バッチ全体を中断してアラート通知 |
| UPSERT 失敗 | そのゲームをスキップしてログ出力、バッチは継続 |

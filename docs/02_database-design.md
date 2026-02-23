# データベース設計書
## ゲーマー向けリアルタイムマッチングプラットフォーム

**ver 1.2 | 2026年2月**

---

## 目次

1. [概要](#1-概要)
2. [テーブル一覧](#2-テーブル一覧)
3. [テーブル詳細定義](#3-テーブル詳細定義)
4. [インデックス設計](#4-インデックス設計)
5. [制約・整合性設計](#5-制約整合性設計)
6. [Prismaスキーマ](#6-prismaスキーマ)
7. [フェーズ移行における考慮点](#7-フェーズ移行における考慮点)

> **v1.1 変更点**: `play_style`（自由文字列）を廃止し、`play_style_tags` マスタテーブルと中間テーブルによる選択式タグ設計に変更。

> **v1.2 変更点**: `rooms.game_title`（自由文字列）を廃止し、IGDBから取得したゲーム情報を管理する `games` テーブルへの外部キー `game_id` に変更。ユーザーがプレイしているゲームを複数登録できる `user_games` 中間テーブルを追加。

---

## 1. 概要

### 1.1 使用DB

- **メインDB**: PostgreSQL（Supabase / Railway）
- **ORM**: Prisma 5.x
- **キャッシュ**: Redis（セッション管理）

### 1.2 設計方針

- すべての主キーは `UUID v4` を使用し、連番によるID推測攻撃を防ぐ
- 論理削除（`deleted_at`）は採用しない。不要データは物理削除またはアーカイブテーブルに移動する
- タイムスタンプはすべて `TIMESTAMPTZ`（タイムゾーン付き）で統一する
- 評価の重複チェックなど整合性が必要な制約はDBレベルで保証する
- Phase 2以降のスケールアウトに備え、シャーディングキーを意識したテーブル設計とする

---

## 2. テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザー情報（Google OAuth連携） |
| `rooms` | マッチング部屋情報 |
| `room_participants` | 部屋への参加履歴・現在の参加状態 |
| `chat_messages` | 部屋内チャットメッセージ |
| `ratings` | セッション後のユーザー相互評価 |
| `play_style_tags` | プレイスタイルタグのマスタ |
| `user_play_style_tags` | ユーザーとプレイスタイルタグの中間テーブル |
| `room_play_style_tags` | 部屋とプレイスタイルタグの中間テーブル |
| `games` | IGDBから取得したゲーム情報のキャッシュ |
| `user_games` | ユーザーがプレイしているゲームの中間テーブル |

---

## 3. テーブル詳細定義

### 3.1 `users` テーブル

ユーザーのプロフィール情報・評価集計値を管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `google_id` | `VARCHAR(255)` | NOT NULL | - | Google OAuth のサブジェクトID |
| `username` | `VARCHAR(50)` | NOT NULL | - | 表示名（ユニーク） |
| `icon_url` | `TEXT` | NULL | - | プロフィール画像URL |
| `bio` | `TEXT` | NULL | - | 自己紹介文（上限500文字はアプリ側で制御） |
| `avg_rating` | `NUMERIC(3,2)` | NOT NULL | `0.00` | 平均評価スコア（1.00〜5.00） |
| `rating_count` | `INTEGER` | NOT NULL | `0` | 評価を受けた累計回数 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 登録日時 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 最終更新日時 |

> **変更点（v1.1）**: `play_style` カラムを廃止。プレイスタイルは `user_play_style_tags` 中間テーブルで管理する。

**制約**

- `UNIQUE (google_id)`
- `UNIQUE (username)`
- `CHECK (avg_rating >= 0 AND avg_rating <= 5)`
- `CHECK (rating_count >= 0)`

---

### 3.2 `rooms` テーブル

マッチング部屋のメタ情報・ステータスを管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `host_id` | `UUID` | NOT NULL | - | ホストユーザーID（FK: users.id） |
| `title` | `VARCHAR(100)` | NOT NULL | - | 部屋タイトル |
| `game_id` | `UUID` | NOT NULL | - | ゲームID（FK: games.id） |
| `max_players` | `SMALLINT` | NOT NULL | - | 最大参加人数（2〜16） |
| `description` | `TEXT` | NULL | - | 部屋の説明・補足 |
| `status` | `room_status` | NOT NULL | `'waiting'` | 部屋ステータス（ENUM） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 作成日時 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 最終更新日時 |
| `closed_at` | `TIMESTAMPTZ` | NULL | - | 解散・終了日時 |

> **変更点（v1.2）**: `game_title`（自由文字列）を廃止。ゲームは `games` テーブルへの外部キー `game_id` で管理し、表記揺れを排除する。

**ENUM: `room_status`**

| 値 | 説明 |
|----|------|
| `waiting` | 参加者募集中 |
| `playing` | ゲーム進行中（満員または開始済み） |
| `closed` | 解散済み |

**制約**

- `FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL`
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT`
- `CHECK (max_players >= 2 AND max_players <= 16)`

---

### 3.3 `room_participants` テーブル

ユーザーと部屋の多対多関係（中間テーブル）。現在の参加者および過去参加履歴を管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NOT NULL | - | FK: users.id |
| `is_host` | `BOOLEAN` | NOT NULL | `false` | ホストかどうか |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 参加日時 |
| `left_at` | `TIMESTAMPTZ` | NULL | - | 退室日時（NULL = 現在参加中） |

**制約**

- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE (room_id, user_id, joined_at)` — 同一ユーザーの再参加を許容しつつ重複を防ぐ

> **備考**: 同一ユーザーが退室後に再参加した場合、新しいレコードを追加する。`left_at IS NULL` のレコードが現在の参加者を表す。

---

### 3.4 `chat_messages` テーブル

部屋内のチャットメッセージを永続化する。リアルタイム通信はSocket.IOが担い、このテーブルは履歴参照・ログ用途。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NULL | - | FK: users.id（NULLの場合はシステムメッセージ） |
| `content` | `TEXT` | NOT NULL | - | メッセージ本文 |
| `is_system` | `BOOLEAN` | NOT NULL | `false` | システムメッセージかどうか |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 送信日時 |

**制約**

- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
- `CHECK (is_system = true OR user_id IS NOT NULL)` — 通常メッセージは必ずuser_idが必要

---

### 3.5 `ratings` テーブル

セッション終了後のユーザー間相互評価を管理する。評価は一定期間のみ有効（`expires_at`）。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id（どの部屋のセッションか） |
| `reviewer_id` | `UUID` | NOT NULL | - | 評価したユーザー（FK: users.id） |
| `reviewee_id` | `UUID` | NOT NULL | - | 評価されたユーザー（FK: users.id） |
| `score` | `SMALLINT` | NOT NULL | - | 評価スコア（1〜5） |
| `comment` | `TEXT` | NULL | - | 任意コメント |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 評価日時 |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | - | 評価受付期限（作成から24時間など） |

**制約**

- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE (room_id, reviewer_id, reviewee_id)` — 同一セッション・同一ペアで1回のみ評価可能
- `CHECK (score >= 1 AND score <= 5)`
- `CHECK (reviewer_id <> reviewee_id)` — 自己評価禁止

---

### 3.6 `play_style_tags` テーブル

プレイスタイルタグのマスタデータを管理する。タグの追加・廃止はこのテーブルで一元管理し、アプリ側はここから取得した選択肢をUIに表示する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `name` | `VARCHAR(50)` | NOT NULL | - | タグ名（例: ガチ勢、エンジョイ勢、初心者歓迎） |
| `slug` | `VARCHAR(50)` | NOT NULL | - | URLやコード用の識別子（例: `hardcore`, `casual`） |
| `display_order` | `SMALLINT` | NOT NULL | `0` | UI表示順 |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | 有効フラグ（falseにすると新規選択不可） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 作成日時 |

**制約**

- `UNIQUE (name)`
- `UNIQUE (slug)`

**初期データ（例）**

| name | slug | display_order |
|------|------|--------------|
| ガチ勢 | `hardcore` | 1 |
| エンジョイ勢 | `casual` | 2 |
| 初心者歓迎 | `beginner_friendly` | 3 |
| 上級者向け | `advanced` | 4 |
| 深夜勢 | `late_night` | 5 |
| 配信者 | `streamer` | 6 |

---

### 3.7 `user_play_style_tags` テーブル

ユーザーとプレイスタイルタグの多対多関係（中間テーブル）。1ユーザーが複数のタグを持てる。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `user_id` | `UUID` | NOT NULL | - | FK: users.id |
| `tag_id` | `UUID` | NOT NULL | - | FK: play_style_tags.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 設定日時 |

**制約**

- `PRIMARY KEY (user_id, tag_id)` — 複合主キー
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES play_style_tags(id) ON DELETE RESTRICT`

> `tag_id` の `ON DELETE RESTRICT` により、使用中のタグを誤って削除できないようにする。タグを廃止する場合は `is_active = false` に更新する。

---

### 3.8 `room_play_style_tags` テーブル

部屋とプレイスタイルタグの多対多関係（中間テーブル）。1部屋が複数のタグを持てる。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `tag_id` | `UUID` | NOT NULL | - | FK: play_style_tags.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 設定日時 |

**制約**

- `PRIMARY KEY (room_id, tag_id)` — 複合主キー
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES play_style_tags(id) ON DELETE RESTRICT`

### 3.9 `games` テーブル

IGDBから取得したゲーム情報のキャッシュを管理する。バックエンドがIGDB APIを呼び出した際に取得・更新し、フロントエンドからのゲーム検索はこのテーブルを経由して返す。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | 主キー |
| `igdb_id` | `INTEGER` | NOT NULL | - | IGDB上のゲームID |
| `name` | `VARCHAR(255)` | NOT NULL | - | ゲーム名 |
| `cover_url` | `TEXT` | NULL | - | カバー画像URL（IGDBから取得） |
| `cached_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | キャッシュ日時（更新管理用） |

**制約**

- `UNIQUE (igdb_id)`

> `games` テーブルへの直接INSERTはバックエンドのみ行う。フロントエンドはゲーム検索APIを通じてのみアクセスする。`cached_at` が一定期間（例：30日）を超えたレコードは次回検索時にIGDB APIから再取得・更新する。

---

### 3.10 `user_games` テーブル

ユーザーがプレイしているゲームと `games` テーブルの多対多関係（中間テーブル）。1ユーザーが複数のゲームを登録できる。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `user_id` | `UUID` | NOT NULL | - | FK: users.id |
| `game_id` | `UUID` | NOT NULL | - | FK: games.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 登録日時 |

**制約**

- `PRIMARY KEY (user_id, game_id)` — 複合主キー
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT`

> 1ユーザーあたりの登録上限はアプリ層で制御する（上限: **20タイトル**）。

---

### 4.1 インデックス一覧

| テーブル | インデックス名 | 対象カラム | 種別 | 目的 |
|---------|--------------|----------|------|------|
| `users` | `users_google_id_key` | `google_id` | UNIQUE | OAuth認証時の高速ルックアップ |
| `users` | `users_username_key` | `username` | UNIQUE | ユーザー名検索 |
| `rooms` | `idx_rooms_status` | `status` | INDEX | 部屋一覧の絞り込み |
| `rooms` | `idx_rooms_host_id` | `host_id` | INDEX | ホスト別部屋検索 |
| `rooms` | `idx_rooms_game_id` | `game_id` | INDEX | ゲーム別部屋検索 |
| `rooms` | `idx_rooms_created_at` | `created_at DESC` | INDEX | 新着順ソート |
| `games` | `games_igdb_id_key` | `igdb_id` | UNIQUE | IGDB IDによる高速ルックアップ |
| `games` | `idx_games_name` | `name` | INDEX | ゲーム名の検索（前方一致） |
| `room_participants` | `idx_rp_room_id` | `room_id` | INDEX | 部屋の参加者取得 |
| `room_participants` | `idx_rp_user_id` | `user_id` | INDEX | ユーザーの参加履歴取得 |
| `room_participants` | `idx_rp_active` | `room_id, left_at` | PARTIAL INDEX (`left_at IS NULL`) | 現在参加中ユーザーの高速取得 |
| `chat_messages` | `idx_chat_room_created` | `room_id, created_at DESC` | INDEX | チャット履歴取得（最新順） |
| `ratings` | `idx_ratings_reviewee` | `reviewee_id` | INDEX | 被評価者の評価一覧取得 |
| `ratings` | `idx_ratings_room_reviewer` | `room_id, reviewer_id` | INDEX | 評価済みチェック |
| `play_style_tags` | `play_style_tags_slug_key` | `slug` | UNIQUE | slugによる高速検索 |
| `play_style_tags` | `idx_pst_active_order` | `is_active, display_order` | INDEX | UIタグ一覧取得（有効なものを表示順に） |
| `user_play_style_tags` | `idx_upst_tag_id` | `tag_id` | INDEX | タグ別ユーザー検索 |
| `room_play_style_tags` | `idx_rpst_tag_id` | `tag_id` | INDEX | タグ別部屋絞り込み |

---

## 5. 制約・整合性設計

### 5.1 評価の重複チェック

`ratings` テーブルの `UNIQUE (room_id, reviewer_id, reviewee_id)` によりDBレベルで重複を防ぐ。アプリ側でも事前チェックを行い、UNIQUEエラーはユーザーフレンドリーなメッセージに変換する。

### 5.2 評価スコアの集計

`users.avg_rating` と `users.rating_count` は `ratings` テーブルへの INSERT 後、Prismaトランザクション内で以下のように更新する。

```sql
UPDATE users
SET
  rating_count = rating_count + 1,
  avg_rating = ((avg_rating * rating_count) + :new_score) / (rating_count + 1),
  updated_at = NOW()
WHERE id = :reviewee_id;
```

> **代替案（Phase 2以降）**: `ratings` テーブルからの集計ビューまたはPostgreSQLのトリガーで自動更新する。

### 5.3 参加人数上限チェック

`room_participants` への参加INSERT前に、アプリ層でトランザクションを使って参加人数をチェックする。`FOR UPDATE` でロックを取得し、競合状態を防ぐ。

```sql
BEGIN;
SELECT COUNT(*) FROM room_participants
WHERE room_id = :room_id AND left_at IS NULL
FOR UPDATE;
-- COUNT < max_players の場合のみINSERT
COMMIT;
```

### 5.4 ホスト移譲ロジック

ホストが退室した場合、アプリ層で以下を実行する。

1. `room_participants` の `is_host` を更新（次の参加者に移譲）
2. 残り参加者が0人の場合は `rooms.status = 'closed'`、`closed_at = NOW()` に更新

---

## 6. Prismaスキーマ

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoomStatus {
  waiting
  playing
  closed
}

model User {
  id          String   @id @default(uuid()) @db.Uuid
  googleId    String   @unique @map("google_id") @db.VarChar(255)
  username    String   @unique @db.VarChar(50)
  iconUrl     String?  @map("icon_url")
  bio         String?
  avgRating   Decimal  @default(0.00) @map("avg_rating") @db.Decimal(3, 2)
  ratingCount Int      @default(0) @map("rating_count")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  hostedRooms      Room[]               @relation("RoomHost")
  participations   RoomParticipant[]
  sentRatings      Rating[]             @relation("Reviewer")
  receivedRatings  Rating[]             @relation("Reviewee")
  chatMessages     ChatMessage[]
  playStyleTags    UserPlayStyleTag[]
  games            UserGame[]

  @@map("users")
}

model Room {
  id          String     @id @default(uuid()) @db.Uuid
  hostId      String     @map("host_id") @db.Uuid
  title       String     @db.VarChar(100)
  gameId      String     @map("game_id") @db.Uuid
  maxPlayers  Int        @map("max_players") @db.SmallInt
  description String?
  status      RoomStatus @default(waiting)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz
  closedAt    DateTime?  @map("closed_at") @db.Timestamptz

  host          User               @relation("RoomHost", fields: [hostId], references: [id])
  game          Game               @relation(fields: [gameId], references: [id])
  participants  RoomParticipant[]
  chatMessages  ChatMessage[]
  ratings       Rating[]
  playStyleTags RoomPlayStyleTag[]

  @@index([status])
  @@index([hostId])
  @@index([gameId])
  @@index([createdAt(sort: Desc)])
  @@map("rooms")
}

model RoomParticipant {
  id       String    @id @default(uuid()) @db.Uuid
  roomId   String    @map("room_id") @db.Uuid
  userId   String    @map("user_id") @db.Uuid
  isHost   Boolean   @default(false) @map("is_host")
  joinedAt DateTime  @default(now()) @map("joined_at") @db.Timestamptz
  leftAt   DateTime? @map("left_at") @db.Timestamptz

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roomId, userId, joinedAt])
  @@index([roomId])
  @@index([userId])
  @@map("room_participants")
}

model ChatMessage {
  id        String   @id @default(uuid()) @db.Uuid
  roomId    String   @map("room_id") @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  content   String
  isSystem  Boolean  @default(false) @map("is_system")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  room Room  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([roomId, createdAt(sort: Desc)])
  @@map("chat_messages")
}

model Rating {
  id         String   @id @default(uuid()) @db.Uuid
  roomId     String   @map("room_id") @db.Uuid
  reviewerId String   @map("reviewer_id") @db.Uuid
  revieweeId String   @map("reviewee_id") @db.Uuid
  score      Int      @db.SmallInt
  comment    String?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  expiresAt  DateTime @map("expires_at") @db.Timestamptz

  room     Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  reviewer User @relation("Reviewer", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewee User @relation("Reviewee", fields: [revieweeId], references: [id], onDelete: Cascade)

  @@unique([roomId, reviewerId, revieweeId])
  @@index([revieweeId])
  @@index([roomId, reviewerId])
  @@map("ratings")
}

model PlayStyleTag {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @unique @db.VarChar(50)
  slug         String   @unique @db.VarChar(50)
  displayOrder Int      @default(0) @map("display_order") @db.SmallInt
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  userTags UserPlayStyleTag[]
  roomTags RoomPlayStyleTag[]

  @@index([isActive, displayOrder])
  @@map("play_style_tags")
}

model UserPlayStyleTag {
  userId    String   @map("user_id") @db.Uuid
  tagId     String   @map("tag_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag  PlayStyleTag @relation(fields: [tagId], references: [id])

  @@id([userId, tagId])
  @@index([tagId])
  @@map("user_play_style_tags")
}

model RoomPlayStyleTag {
  roomId    String   @map("room_id") @db.Uuid
  tagId     String   @map("tag_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  room Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tag  PlayStyleTag @relation(fields: [tagId], references: [id])

  @@id([roomId, tagId])
  @@index([tagId])
  @@map("room_play_style_tags")
}

model Game {
  id        String   @id @default(uuid()) @db.Uuid
  igdbId    Int      @unique @map("igdb_id")
  name      String   @db.VarChar(255)
  coverUrl  String?  @map("cover_url")
  cachedAt  DateTime @default(now()) @map("cached_at") @db.Timestamptz

  rooms     Room[]
  userGames UserGame[]

  @@index([name])
  @@map("games")
}

model UserGame {
  userId    String   @map("user_id") @db.Uuid
  gameId    String   @map("game_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  game Game @relation(fields: [gameId], references: [id])

  @@id([userId, gameId])
  @@index([gameId])
  @@map("user_games")
}
```

> **注意**: PrismaではDB側の `CHECK` 制約を直接定義できないため、以下の制約はマイグレーションSQLに手動追加する。

```sql
-- 自己評価禁止
ALTER TABLE ratings ADD CONSTRAINT chk_no_self_rating
  CHECK (reviewer_id <> reviewee_id);

-- 評価スコア範囲
ALTER TABLE ratings ADD CONSTRAINT chk_score_range
  CHECK (score >= 1 AND score <= 5);

-- 最大参加人数範囲
ALTER TABLE rooms ADD CONSTRAINT chk_max_players_range
  CHECK (max_players >= 2 AND max_players <= 16);

-- システムメッセージ以外はuser_id必須
ALTER TABLE chat_messages ADD CONSTRAINT chk_user_or_system
  CHECK (is_system = true OR user_id IS NOT NULL);

-- PARTIAL INDEX: 現在参加中の高速検索
CREATE INDEX idx_rp_active ON room_participants (room_id)
WHERE left_at IS NULL;

-- play_style_tags 初期データ
INSERT INTO play_style_tags (id, name, slug, display_order) VALUES
  (gen_random_uuid(), 'ガチ勢',     'hardcore',          1),
  (gen_random_uuid(), 'エンジョイ勢', 'casual',            2),
  (gen_random_uuid(), '初心者歓迎',  'beginner_friendly', 3),
  (gen_random_uuid(), '上級者向け',  'advanced',          4),
  (gen_random_uuid(), '深夜勢',     'late_night',         5),
  (gen_random_uuid(), '配信者',     'streamer',           6);
```

---

## 7. フェーズ移行における考慮点

### Phase 1 → 2

| 対応内容 | 詳細 |
|---------|------|
| 読み取りレプリカの追加 | `rooms`・`chat_messages` など読み取り負荷が高いテーブルへのSELECTをレプリカに向ける |
| Redis Pub/Subの本格活用 | Socket.IO Redis Adapterを追加し、WebSocketサーバーを複数台にスケールアウト |
| `chat_messages` のアーカイブ | 古い部屋（`status = 'closed'`）のチャットを別テーブルまたはコールドストレージに移動 |

### Phase 2 → 3

| 対応内容 | 詳細 |
|---------|------|
| DBシャーディングの検討 | `rooms` と `chat_messages` は `room_id` をシャーディングキーとして水平分割が可能な設計になっている |
| `ratings` のバッチ集計 | 大量評価が蓄積した場合、`avg_rating` のリアルタイム更新からバッチ集計に切り替える |
| 全文検索の導入 | `rooms.title` の検索精度向上のためPostgreSQLの `tsvector` またはElasticsearchを検討。ゲーム検索はIGDB APIを継続利用 |

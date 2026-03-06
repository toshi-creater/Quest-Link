# データベース設計書
## ゲーマー向けリアルタイムマッチングプラットフォーム

---

## 1. テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザー情報 |
| `oauth_providers` | OAuthプロバイダ連携情報 |
| `rooms` | マッチング部屋 |
| `room_participants` | 部屋参加者（現在・履歴） |
| `chat_messages` | 部屋内チャット |
| `ratings` | セッション後の相互評価 |
| `play_style_tags` | プレイスタイルタグ マスタ |
| `user_play_style_tags` | ユーザー × タグ |
| `room_play_style_tags` | 部屋 × タグ |
| `games` | ゲーム情報マスタ（IGDB連携） |
| `user_games` | ユーザー × ゲーム |
| `sns_share_logs` | SNSシェア投稿ログ（レート制限用） |

---

## 2. テーブル詳細定義

### 2.1 `users`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `username` | `VARCHAR(50)` | NOT NULL | - | 表示名 |
| `icon_url` | `TEXT` | NULL | - | プロフィール画像URL |
| `bio` | `TEXT` | NULL | - | 自己紹介文 |
| `discord_webhook_url` | `TEXT` | NULL | - | Discord Webhook URL（SNSシェア用・1サーバーまで） |
| `avg_rating` | `NUMERIC(3,2)` | NOT NULL | `0.00` | 平均評価スコア |
| `rating_count` | `INTEGER` | NOT NULL | `0` | 評価受取累計数 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `UNIQUE (username)`
- `CHECK (avg_rating >= 0 AND avg_rating <= 5)`
- `CHECK (rating_count >= 0)`

---

### 2.2 `oauth_providers`

Google / X / Discord の3プロバイダに対応するため、プロバイダ情報を `users` から分離して管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `user_id` | `UUID` | NOT NULL | - | FK: users.id |
| `provider` | `oauth_provider` | NOT NULL | - | プロバイダ種別（ENUM） |
| `provider_user_id` | `VARCHAR(255)` | NOT NULL | - | プロバイダ側のユーザーID |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**ENUM: `oauth_provider`**

| 値 | 説明 |
|----|------|
| `google` | Google OAuth 2.0 |
| `x` | X OAuth 2.0 |
| `discord` | Discord OAuth 2.0 |

**制約**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE (provider, provider_user_id)`

---

### 2.3 `rooms`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `host_id` | `UUID` | NOT NULL | - | FK: users.id |
| `game_id` | `UUID` | NOT NULL | - | FK: games.id |
| `title` | `VARCHAR(100)` | NOT NULL | - | 部屋タイトル |
| `max_players` | `SMALLINT` | NOT NULL | - | 最大参加人数（2〜16） |
| `description` | `TEXT` | NULL | - | 補足説明 |
| `status` | `room_status` | NOT NULL | `'waiting'` | 部屋ステータス（ENUM） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |
| `closed_at` | `TIMESTAMPTZ` | NULL | - | 解散日時 |

**ENUM: `room_status`**

| 値 | 説明 |
|----|------|
| `waiting` | 参加者募集中 |
| `full` | 満員（参加不可・閲覧のみ） |
| `closed` | 終了済み |

**制約**
- `FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL`
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT`
- `CHECK (max_players >= 2 AND max_players <= 16)`

---

### 2.4 `room_participants`

`left_at IS NULL` のレコードが現在参加中を表す。同一ユーザーの再参加は新規レコードで表現する。ゲスト参加者は `user_id` が NULL となり、`guest_session_id` で識別する。ホスト移譲の対象はログイン済み参加者（`user_id IS NOT NULL`）のみ。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NULL | - | FK: users.id（NULL = ゲスト参加者） |
| `guest_session_id` | `VARCHAR(50)` | NULL | - | ゲストセッションID（例: `guest_xxxxxxxx`）。ログイン済みはNULL |
| `display_name` | `VARCHAR(50)` | NULL | - | ゲスト表示名。ログイン済みはNULL（usersから取得） |
| `is_host` | `BOOLEAN` | NOT NULL | `false` | ホストかどうか（ゲストは常にfalse） |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 参加日時 |
| `left_at` | `TIMESTAMPTZ` | NULL | - | 退室日時 |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)` — どちらか必須
- `UNIQUE (room_id, user_id, joined_at)` WHERE `user_id IS NOT NULL` — ログイン済みの重複参加防止
- `UNIQUE (room_id, guest_session_id)` WHERE `guest_session_id IS NOT NULL` — ゲストの重複参加防止

---

### 2.5 `chat_messages`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NULL | - | FK: users.id（NULL = システムメッセージ） |
| `content` | `TEXT` | NOT NULL | - | メッセージ本文 |
| `is_system` | `BOOLEAN` | NOT NULL | `false` | システムメッセージかどうか |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
- `CHECK (is_system = true OR user_id IS NOT NULL)`

---

### 2.6 `ratings`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `reviewer_id` | `UUID` | NOT NULL | - | FK: users.id（評価した側） |
| `reviewee_id` | `UUID` | NOT NULL | - | FK: users.id（評価された側） |
| `score` | `SMALLINT` | NOT NULL | - | 評価スコア（1〜5） |
| `comment` | `TEXT` | NULL | - | 任意コメント |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | - | 評価受付期限 |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE (room_id, reviewer_id, reviewee_id)`
- `CHECK (score >= 1 AND score <= 5)`
- `CHECK (reviewer_id <> reviewee_id)`

---

### 2.7 `play_style_tags`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `name` | `VARCHAR(50)` | NOT NULL | - | タグ名（例: ガチ勢） |
| `slug` | `VARCHAR(50)` | NOT NULL | - | コード用識別子（例: `hardcore`） |
| `display_order` | `SMALLINT` | NOT NULL | `0` | UI表示順 |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | falseで新規選択不可 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `UNIQUE (name)`
- `UNIQUE (slug)`

**初期データ**

| name | slug | display_order |
|------|------|--------------|
| カジュアル | `casual` | 1 |
| ランク重視 | `ranked` | 2 |
| 初心者歓迎 | `beginner_friendly` | 3 |
| 上級者限定 | `advanced_only` | 4 |

---

### 2.8 `user_play_style_tags`

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| `user_id` | `UUID` | NOT NULL | PK / FK: users.id |
| `tag_id` | `UUID` | NOT NULL | PK / FK: play_style_tags.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | - |

**制約**
- `PRIMARY KEY (user_id, tag_id)`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES play_style_tags(id) ON DELETE RESTRICT`

---

### 2.9 `room_play_style_tags`

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| `room_id` | `UUID` | NOT NULL | PK / FK: rooms.id |
| `tag_id` | `UUID` | NOT NULL | PK / FK: play_style_tags.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | - |

**制約**
- `PRIMARY KEY (room_id, tag_id)`
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (tag_id) REFERENCES play_style_tags(id) ON DELETE RESTRICT`

---

### 2.10 `games`

IGDBからピックアップして自社マスターDBに登録するゲーム情報。運営のみ追加・編集可。MVP登録数は20〜30タイトル。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `igdb_id` | `INTEGER` | NOT NULL | - | IGDB上のゲームID |
| `name` | `VARCHAR(255)` | NOT NULL | - | ゲーム名 |
| `cover_image_url` | `TEXT` | NULL | - | IGDBカバー画像URL（表示時に直接参照） |
| `genre` | `VARCHAR(50)` | NULL | - | ジャンル（例: FPS / RPG / MOBA） |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | falseでゲーム選択画面から非表示 |
| `display_order` | `SMALLINT` | NOT NULL | `0` | ゲーム選択画面でのグリッド表示順 |
| `cached_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | マスター登録・更新日時 |

**制約**
- `UNIQUE (igdb_id)`

---

### 2.11 `user_games`

| カラム名 | 型 | NULL | 説明 |
|---------|-----|------|------|
| `user_id` | `UUID` | NOT NULL | PK / FK: users.id |
| `game_id` | `UUID` | NOT NULL | PK / FK: games.id |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | - |

**制約**
- `PRIMARY KEY (user_id, game_id)`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE`

---

### 2.12 `sns_share_logs`

SNSシェア投稿のログ。1部屋・1時間あたり3回の投稿制限をアプリ層で判定するために使用する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NOT NULL | - | FK: users.id（投稿操作者） |
| `platform` | `sns_platform` | NOT NULL | - | 投稿先プラットフォーム（ENUM） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 投稿日時 |

**ENUM: `sns_platform`**

| 値 | 説明 |
|----|------|
| `x` | X（Twitter） |
| `discord` | Discord Webhook |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

> レート制限の判定は `WHERE room_id = :room_id AND created_at > NOW() - INTERVAL '1 hour'` で直近1時間の件数をカウントして行う。

---

## 3. インデックス設計

| テーブル | カラム | 種別 | 目的 |
|---------|--------|------|------|
| `oauth_providers` | `(provider, provider_user_id)` | UNIQUE | OAuth認証時のユーザー特定 |
| `oauth_providers` | `user_id` | INDEX | ユーザー別プロバイダ取得 |
| `rooms` | `status` | INDEX | ステータス絞り込み |
| `rooms` | `game_id` | INDEX | ゲーム別絞り込み |
| `rooms` | `created_at DESC` | INDEX | 新着順ソート |
| `rooms` | `(title, description)` tsvector | GIN INDEX | フリーワード全文検索（Phase 1） |
| `room_participants` | `room_id` WHERE `left_at IS NULL` | PARTIAL INDEX | 現在参加中ユーザーの取得 |
| `room_participants` | `guest_session_id` | INDEX | ゲストセッションによる参加状態確認 |
| `room_participants` | `user_id` | INDEX | ユーザー参加履歴 |
| `chat_messages` | `(room_id, created_at DESC)` | INDEX | チャット履歴取得 |
| `ratings` | `reviewee_id` | INDEX | 被評価者の評価一覧 |
| `ratings` | `(room_id, reviewer_id)` | INDEX | 評価済みチェック |
| `play_style_tags` | `(is_active, display_order)` | INDEX | UIタグ一覧取得 |
| `user_play_style_tags` | `tag_id` | INDEX | タグ別ユーザー検索 |
| `room_play_style_tags` | `tag_id` | INDEX | タグ別部屋絞り込み |
| `games` | `name` | INDEX | ゲーム名検索 |
| `games` | `(is_active, display_order)` | INDEX | ゲーム選択画面の表示順取得 |
| `user_games` | `game_id` | INDEX | ゲーム別ユーザー検索 |
| `sns_share_logs` | `(room_id, created_at DESC)` | INDEX | レート制限判定（直近1時間の投稿数集計） |

```sql
CREATE INDEX idx_rp_active ON room_participants (room_id)
WHERE left_at IS NULL;

-- フリーワード全文検索用（部屋名・募集文対象、Phase 1）
CREATE INDEX idx_rooms_fts ON rooms
USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
```

---

## 4. 制約・整合性設計

### 4.1 Prismaで定義できないCHECK制約（マイグレーションSQLで追加）

```sql
ALTER TABLE ratings ADD CONSTRAINT chk_no_self_rating
  CHECK (reviewer_id <> reviewee_id);

ALTER TABLE ratings ADD CONSTRAINT chk_score_range
  CHECK (score >= 1 AND score <= 5);

ALTER TABLE rooms ADD CONSTRAINT chk_max_players_range
  CHECK (max_players >= 2 AND max_players <= 16);

ALTER TABLE chat_messages ADD CONSTRAINT chk_user_or_system
  CHECK (is_system = true OR user_id IS NOT NULL);

-- ログイン済みとゲストは排他。どちらか必ず存在する
ALTER TABLE room_participants ADD CONSTRAINT chk_participant_identity
  CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );
```

### 4.2 評価スコアの集計

`ratings` INSERT後、同一トランザクション内で `users` を更新する。

```sql
UPDATE users
SET
  rating_count = rating_count + 1,
  avg_rating   = ((avg_rating * rating_count) + :new_score) / (rating_count + 1),
  updated_at   = NOW()
WHERE id = :reviewee_id;
```

### 4.3 参加人数上限チェック

競合を防ぐため `FOR UPDATE` でロックを取得してからINSERT判定する。

```sql
BEGIN;
SELECT COUNT(*) FROM room_participants
WHERE room_id = :room_id AND left_at IS NULL
FOR UPDATE;
-- COUNT < max_players の場合のみINSERT
COMMIT;
```

### 4.4 ホスト移譲ロジック

ホストが退室した場合、アプリ層で以下を実行する。

1. `user_id IS NOT NULL`（ログイン済み）かつ `left_at IS NULL` の参加者のうち `joined_at` が最も古いユーザーの `is_host` を `true` に更新
2. ログイン済み参加者が0人（全員ゲストまたは0人）の場合は `rooms.status = 'closed'`、`closed_at = NOW()` を設定

### 4.5 play_style_tags の廃止手順

削除すると中間テーブル参照が壊れるため（`ON DELETE RESTRICT`）、廃止は `is_active = false` の更新で行う。

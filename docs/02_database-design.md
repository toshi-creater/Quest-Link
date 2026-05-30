# データベース設計書
## ゲーマー向けリアルタイムマッチングプラットフォーム

---

## 1. テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザー情報 |
| `oauth_providers` | OAuthプロバイダ連携情報 |
| `rooms` | マッチング部屋 |
| `guests` | ゲストユーザー情報 |
| `room_participants` | 部屋参加者（現在・履歴） |
| `chat_messages` | 部屋内チャット |
| `ratings` | セッション後の相互評価 |
| `play_style_tags` | プレイスタイルタグ マスタ |
| `room_play_style_tags` | 部屋 × タグ |
| `games` | ゲーム情報マスタ |
| `user_games` | ユーザー × ゲーム |
| `sns_share_logs` | SNSシェア投稿ログ（レート制限用） |
| `reports` | ユーザー・メッセージ通報 |
| `blocks` | ユーザーブロック |

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
| `invite_token` | `VARCHAR(64)` | NULL | - | 招待URL用トークン（64文字hex）。NULL = 招待リンク未発行 |
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
- `FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE RESTRICT`
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT`
- `CHECK (max_players >= 2 AND max_players <= 16)`
- `UNIQUE (invite_token)`

---

### 2.4 `guests`

招待リンク経由で参加したゲストユーザーの情報。`guest_session_id` を一意キーとして管理し、`room_participants` および `chat_messages` から参照される。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `guest_session_id` | `VARCHAR(50)` | NOT NULL | - | ゲストセッションID（`guest_` + 32桁hex）|
| `display_name` | `VARCHAR(50)` | NOT NULL | - | ゲスト表示名 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `UNIQUE (guest_session_id)`

---

### 2.5 `room_participants`

`left_at IS NULL` のレコードが現在参加中を表す。同一ユーザーの再参加は新規レコードで表現する。ゲスト参加者は `user_id` が NULL となり、`guest_session_id` で識別する。ホスト移譲の対象はログイン済み参加者（`user_id IS NOT NULL`）のみ。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NULL | - | FK: users.id（NULL = ゲスト参加者） |
| `guest_session_id` | `VARCHAR(50)` | NULL | - | ゲストセッションID。ログイン済みはNULL |
| `is_host` | `BOOLEAN` | NOT NULL | `false` | ホストかどうか（ゲストは常にfalse） |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 参加日時 |
| `left_at` | `TIMESTAMPTZ` | NULL | - | 退室日時 |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `CHECK (user_id IS NOT NULL AND guest_session_id IS NULL) OR (user_id IS NULL AND guest_session_id IS NOT NULL)` — ユーザーとゲストは排他、どちらか必須

---

### 2.6 `chat_messages`

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `room_id` | `UUID` | NOT NULL | - | FK: rooms.id |
| `user_id` | `UUID` | NULL | - | FK: users.id（ログイン済みユーザーのメッセージ） |
| `guest_id` | `UUID` | NULL | - | FK: guests.id（ゲストのメッセージ） |
| `content` | `TEXT` | NOT NULL | - | メッセージ本文 |
| `is_system` | `BOOLEAN` | NOT NULL | `false` | システムメッセージかどうか |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
- `FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL`
- `CHECK (is_system = true OR user_id IS NOT NULL OR guest_id IS NOT NULL)`

---

### 2.7 `ratings`

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

### 2.8 `play_style_tags`

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

運営がマスター登録するゲーム情報。運営のみ追加・編集可。MVP登録数は20〜30タイトル。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `igdb_id` | `INTEGER` | NULL | - | 任意の外部参照ID（運営作業時の参照用。NULL可） |
| `name` | `VARCHAR(255)` | NOT NULL | - | ゲーム名 |
| `cover_image_url` | `TEXT` | NULL | - | カバー画像URL（表示時に直接参照） |
| `genre` | `TEXT[]` | NOT NULL | `{}` | ジャンル配列（例: `["FPS", "MOBA"]`） |
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

### 2.13 `reports`

ユーザーまたはメッセージに対する通報。`target_user_id` と `target_message_id` のいずれか一方のみを持つ。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PK |
| `reporter_id` | `UUID` | NOT NULL | - | FK: users.id（通報した側） |
| `target_user_id` | `UUID` | NULL | - | FK: users.id（通報対象ユーザー） |
| `target_message_id` | `UUID` | NULL | - | FK: chat_messages.id（通報対象メッセージ） |
| `reason` | `report_reason` | NOT NULL | - | 通報理由（ENUM） |
| `detail` | `VARCHAR(500)` | NULL | - | 詳細コメント（`other` の場合は必須） |
| `status` | `report_status` | NOT NULL | `'pending'` | 対応状況（ENUM） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**ENUM: `report_reason`**

| 値 | 説明 |
|----|------|
| `harassment` | 嫌がらせ |
| `spam` | スパム |
| `hate_speech` | ヘイトスピーチ |
| `inappropriate_content` | 不適切なコンテンツ |
| `other` | その他 |

**ENUM: `report_status`**

| 値 | 説明 |
|----|------|
| `pending` | 未対応（デフォルト） |
| `reviewed` | 確認済み |
| `resolved` | 対応済み |
| `dismissed` | 却下 |

**制約**
- `FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (target_message_id) REFERENCES chat_messages(id) ON DELETE CASCADE`
- `CHECK (target_user_id IS NOT NULL OR target_message_id IS NOT NULL)` — どちらか必須

---

### 2.14 `blocks`

ユーザー間のブロック関係。`(blocker_id, blocked_id)` を複合主キーとして管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `blocker_id` | `UUID` | NOT NULL | - | PK / FK: users.id（ブロックした側） |
| `blocked_id` | `UUID` | NOT NULL | - | PK / FK: users.id（ブロックされた側） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - |

**制約**
- `PRIMARY KEY (blocker_id, blocked_id)`
- `FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE`
- `CHECK (blocker_id <> blocked_id)` — 自己ブロック禁止

---

## 3. インデックス設計

| テーブル | カラム | 種別 | 目的 |
|---------|--------|------|------|
| `oauth_providers` | `(provider, provider_user_id)` | UNIQUE | OAuth認証時のユーザー特定 |
| `oauth_providers` | `user_id` | INDEX | ユーザー別プロバイダ取得 |
| `guests` | `guest_session_id` | UNIQUE | ゲストセッションIDによるユーザー特定 |
| `rooms` | `status` | INDEX | ステータス絞り込み |
| `rooms` | `game_id` | INDEX | ゲーム別絞り込み |
| `rooms` | `created_at DESC` | INDEX | 新着順ソート |
| `rooms` | `(game_id, status, created_at DESC)` | INDEX | ゲーム別部屋一覧の複合絞り込み |
| `rooms` | `(title, description)` tsvector | GIN INDEX | フリーワード全文検索（Phase 1） |
| `room_participants` | `room_id` WHERE `left_at IS NULL` | PARTIAL INDEX | 現在参加中ユーザーの取得 |
| `room_participants` | `guest_session_id` | INDEX | ゲストセッションによる参加状態確認 |
| `room_participants` | `user_id` | INDEX | ユーザー参加履歴 |
| `chat_messages` | `(room_id, created_at DESC)` | INDEX | チャット履歴取得 |
| `ratings` | `reviewee_id` | INDEX | 被評価者の評価一覧 |
| `ratings` | `(room_id, reviewer_id)` | INDEX | 評価済みチェック |
| `play_style_tags` | `(is_active, display_order)` | INDEX | UIタグ一覧取得 |
| `room_play_style_tags` | `tag_id` | INDEX | タグ別部屋絞り込み |
| `games` | `name` | INDEX | ゲーム名検索 |
| `games` | `(is_active, display_order)` | INDEX | ゲーム選択画面の表示順取得 |
| `user_games` | `game_id` | INDEX | ゲーム別ユーザー検索 |
| `sns_share_logs` | `(room_id, created_at DESC)` | INDEX | レート制限判定（直近1時間の投稿数集計） |
| `reports` | `reporter_id` | INDEX | 通報者別一覧取得 |
| `reports` | `target_user_id` | INDEX | 通報対象ユーザー別一覧取得 |
| `reports` | `(status, created_at DESC)` | INDEX | 運営管理画面での未対応通報一覧 |
| `blocks` | `blocked_id` | INDEX | 自分をブロックしているユーザーの逆引き |

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

-- システムメッセージ以外は user_id か guest_id のどちらかが必須
ALTER TABLE chat_messages ADD CONSTRAINT chk_user_or_system
  CHECK (is_system = true OR user_id IS NOT NULL OR guest_id IS NOT NULL);

-- ログイン済みとゲストは排他。どちらか必ず存在する
ALTER TABLE room_participants ADD CONSTRAINT chk_participant_identity
  CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );
```

### 4.2 評価スコアの集計

`ratings` INSERT後、同一トランザクション内で `ratings` テーブルを集計し直して `users` を更新する。
インクリメンタル更新（`(avg * count + score) / (count + 1)`）は浮動小数点誤差が蓄積するため、
全件 `AVG` + `COUNT` の再集計方式を採用している。

```typescript
// アプリ層（Prisma）での実装
const aggregate = await tx.rating.aggregate({
  where: { revieweeId },
  _avg: { score: true },
  _count: { score: true },
});
await tx.user.update({
  where: { id: revieweeId },
  data: {
    avgRating: aggregate._avg.score ?? 0,
    ratingCount: aggregate._count.score,
  },
});
```

### 4.3 参加人数上限チェック

#### ログイン済みユーザーの参加（単一 CTE・1RTT）

`$transaction`（5RTT）の代わりに、ロック・カウント・INSERT・ステータス更新を単一CTEクエリで実行する。
DB ラウンドトリップを 1RTT に削減するためのパフォーマンス最適化。

```sql
WITH
  lock AS (
    SELECT id, max_players FROM rooms WHERE id = :room_id FOR UPDATE
  ),
  active AS (
    SELECT COUNT(*) AS cnt FROM room_participants
    WHERE room_id = :room_id AND left_at IS NULL
  ),
  ins AS (
    INSERT INTO room_participants (id, room_id, user_id, is_host, joined_at)
    SELECT gen_random_uuid(), :room_id, :user_id, false, NOW()
    WHERE (SELECT cnt FROM active) < (SELECT max_players FROM lock)
    RETURNING id, joined_at
  ),
  upd AS (
    UPDATE rooms SET status = 'full'
    WHERE id = :room_id
      AND (SELECT cnt FROM active) + 1 >= (SELECT max_players FROM lock)
      AND EXISTS (SELECT 1 FROM ins)
  )
SELECT
  (SELECT max_players FROM lock) AS max_players,
  (SELECT cnt FROM active)       AS cnt,
  (SELECT id FROM ins)           AS ins_id,
  (SELECT joined_at FROM ins)    AS ins_joined_at;
-- ins_id が NULL → ROOM_FULL
-- UNIQUE 制約違反（23505）→ ALREADY_JOINED
```

#### ゲスト参加（Serializable トランザクション）

招待リンク経由のゲスト参加は `guests` テーブルへの upsert を含むため、
`isolationLevel: "Serializable"` + `SELECT ... FOR UPDATE` のトランザクションで実装する。

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT id FROM rooms WHERE id = :room_id FOR UPDATE;
-- 現在参加数を確認
-- COUNT >= max_players なら ROOM_FULL
-- guests に upsert
-- room_participants に INSERT
-- 満員になった場合は rooms.status = 'full' に更新
COMMIT;
```

### 4.4 ホスト移譲ロジック

ホストが退室した場合、アプリ層で以下を実行する。

1. `user_id IS NOT NULL`（ログイン済み）かつ `left_at IS NULL` の参加者のうち `joined_at` が最も古いユーザーの `is_host` を `true` に更新
2. ログイン済み参加者が0人（全員ゲストまたは0人）の場合は `rooms.status = 'closed'`、`closed_at = NOW()` を設定

### 4.5 play_style_tags の廃止手順

削除すると中間テーブル参照が壊れるため（`ON DELETE RESTRICT`）、廃止は `is_active = false` の更新で行う。

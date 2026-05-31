-- ================================================================
-- docs/02_database-design.md との差分同期マイグレーション
-- ================================================================

-- ① RoomStatus ENUM: playing → full
ALTER TYPE "RoomStatus" RENAME VALUE 'playing' TO 'full';

-- ================================================================
-- ② oauth_providers テーブル追加（google_id カラムを廃止）
-- ================================================================
CREATE TYPE "OauthProvider" AS ENUM ('google', 'x', 'discord');

CREATE TABLE "oauth_providers" (
    "id"               UUID          NOT NULL,
    "user_id"          UUID          NOT NULL,
    "provider"         "OauthProvider" NOT NULL,
    "provider_user_id" VARCHAR(255)  NOT NULL,
    "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_providers_provider_provider_user_id_key"
    ON "oauth_providers"("provider", "provider_user_id");

CREATE INDEX "oauth_providers_user_id_idx"
    ON "oauth_providers"("user_id");

ALTER TABLE "oauth_providers"
    ADD CONSTRAINT "oauth_providers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: 本番環境では users.google_id の値を oauth_providers へ移行してから DROP すること
ALTER TABLE "users" DROP COLUMN "google_id";

-- ================================================================
-- ③ users.discord_webhook_url 追加
-- ================================================================
ALTER TABLE "users" ADD COLUMN "discord_webhook_url" TEXT;

-- ================================================================
-- ⑤ room_participants: ゲスト参加対応
--    user_id を NULL 可能にし、guest_session_id / display_name を追加
-- ================================================================

-- 既存の UNIQUE インデックスを削除し、条件付きに再作成
DROP INDEX "room_participants_room_id_user_id_joined_at_key";

ALTER TABLE "room_participants" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "room_participants" ADD COLUMN "guest_session_id" VARCHAR(50);
ALTER TABLE "room_participants" ADD COLUMN "display_name"     VARCHAR(50);

-- ログイン済みユーザー: 同一部屋に同一ユーザーが同時刻に重複参加しない
CREATE UNIQUE INDEX "room_participants_room_id_user_id_joined_at_key"
    ON "room_participants"("room_id", "user_id", "joined_at")
    WHERE user_id IS NOT NULL;

-- ゲスト: 同一部屋に同一セッションが複数存在しない
CREATE UNIQUE INDEX "room_participants_room_id_guest_session_id_key"
    ON "room_participants"("room_id", "guest_session_id")
    WHERE guest_session_id IS NOT NULL;

CREATE INDEX "room_participants_guest_session_id_idx"
    ON "room_participants"("guest_session_id");

-- user_id か guest_session_id のどちらか一方が必須（排他）
ALTER TABLE "room_participants"
    ADD CONSTRAINT "chk_participant_identity"
    CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR
        (user_id IS NULL     AND guest_session_id IS NOT NULL)
    );

-- ================================================================
-- ⑥ games: genre / is_active / display_order 追加
-- ================================================================
ALTER TABLE "games" ADD COLUMN "genre"         VARCHAR(50);
ALTER TABLE "games" ADD COLUMN "is_active"     BOOLEAN  NOT NULL DEFAULT true;
ALTER TABLE "games" ADD COLUMN "display_order" SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX "games_is_active_display_order_idx"
    ON "games"("is_active", "display_order");

-- ================================================================
-- ⑦ sns_share_logs テーブル追加
-- ================================================================
CREATE TYPE "SnsPlatform" AS ENUM ('x', 'discord');

CREATE TABLE "sns_share_logs" (
    "id"         UUID          NOT NULL,
    "room_id"    UUID          NOT NULL,
    "user_id"    UUID          NOT NULL,
    "platform"   "SnsPlatform" NOT NULL,
    "created_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "sns_share_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sns_share_logs_room_id_created_at_idx"
    ON "sns_share_logs"("room_id", "created_at" DESC);

ALTER TABLE "sns_share_logs"
    ADD CONSTRAINT "sns_share_logs_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sns_share_logs"
    ADD CONSTRAINT "sns_share_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ================================================================
-- ⑫ user_games.game_id FK: RESTRICT → CASCADE
-- ================================================================
ALTER TABLE "user_games" DROP CONSTRAINT "user_games_game_id_fkey";

ALTER TABLE "user_games"
    ADD CONSTRAINT "user_games_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('waiting', 'playing', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "google_id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "icon_url" TEXT,
    "bio" TEXT,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "igdb_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cover_url" TEXT,
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "host_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "game_id" UUID NOT NULL,
    "max_players" SMALLINT NOT NULL,
    "description" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'waiting',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "left_at" TIMESTAMPTZ,

    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "user_id" UUID,
    "content" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewee_id" UUID NOT NULL,
    "score" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "play_style_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "play_style_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_play_style_tags" (
    "user_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "user_play_style_tags_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "room_play_style_tags" (
    "room_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "room_play_style_tags_pkey" PRIMARY KEY ("room_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_games" (
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "user_games_pkey" PRIMARY KEY ("user_id","game_id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "games_igdb_id_key" ON "games"("igdb_id");
CREATE UNIQUE INDEX "room_participants_room_id_user_id_joined_at_key" ON "room_participants"("room_id", "user_id", "joined_at");
CREATE UNIQUE INDEX "ratings_room_id_reviewer_id_reviewee_id_key" ON "ratings"("room_id", "reviewer_id", "reviewee_id");
CREATE UNIQUE INDEX "play_style_tags_name_key" ON "play_style_tags"("name");
CREATE UNIQUE INDEX "play_style_tags_slug_key" ON "play_style_tags"("slug");

-- CreateIndex
CREATE INDEX "idx_rooms_status" ON "rooms"("status");
CREATE INDEX "idx_rooms_host_id" ON "rooms"("host_id");
CREATE INDEX "idx_rooms_game_id" ON "rooms"("game_id");
CREATE INDEX "idx_rooms_created_at" ON "rooms"("created_at" DESC);
CREATE INDEX "idx_games_name" ON "games"("name");
CREATE INDEX "idx_rp_room_id" ON "room_participants"("room_id");
CREATE INDEX "idx_rp_user_id" ON "room_participants"("user_id");
CREATE INDEX "idx_chat_room_created" ON "chat_messages"("room_id", "created_at" DESC);
CREATE INDEX "idx_ratings_reviewee" ON "ratings"("reviewee_id");
CREATE INDEX "idx_ratings_room_reviewer" ON "ratings"("room_id", "reviewer_id");
CREATE INDEX "idx_pst_active_order" ON "play_style_tags"("is_active", "display_order");
CREATE INDEX "idx_upst_tag_id" ON "user_play_style_tags"("tag_id");
CREATE INDEX "idx_rpst_tag_id" ON "room_play_style_tags"("tag_id");
CREATE INDEX "idx_user_games_game_id" ON "user_games"("game_id");

-- PARTIAL INDEX: 現在参加中の参加者を高速取得
CREATE INDEX "idx_rp_active" ON "room_participants"("room_id")
WHERE left_at IS NULL;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey"
    FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rooms" ADD CONSTRAINT "rooms_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_reviewer_id_fkey"
    FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_reviewee_id_fkey"
    FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_play_style_tags" ADD CONSTRAINT "user_play_style_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_play_style_tags" ADD CONSTRAINT "user_play_style_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "play_style_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "room_play_style_tags" ADD CONSTRAINT "room_play_style_tags_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "room_play_style_tags" ADD CONSTRAINT "room_play_style_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "play_style_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_games" ADD CONSTRAINT "user_games_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK制約: Prismaが直接定義できないため手動追加
-- 自己評価禁止
ALTER TABLE "ratings" ADD CONSTRAINT "chk_no_self_rating"
    CHECK (reviewer_id <> reviewee_id);

-- 評価スコア範囲（1〜5）
ALTER TABLE "ratings" ADD CONSTRAINT "chk_score_range"
    CHECK (score >= 1 AND score <= 5);

-- 最大参加人数範囲（2〜16）
ALTER TABLE "rooms" ADD CONSTRAINT "chk_max_players_range"
    CHECK (max_players >= 2 AND max_players <= 16);

-- 通常メッセージはuser_id必須
ALTER TABLE "chat_messages" ADD CONSTRAINT "chk_user_or_system"
    CHECK (is_system = true OR user_id IS NOT NULL);

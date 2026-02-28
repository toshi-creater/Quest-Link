-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_host_id_fkey";

-- DropIndex
DROP INDEX "idx_rp_active";

-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "games" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "play_style_tags" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ratings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "room_participants" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_chat_room_created" RENAME TO "chat_messages_room_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_games_name" RENAME TO "games_name_idx";

-- RenameIndex
ALTER INDEX "idx_pst_active_order" RENAME TO "play_style_tags_is_active_display_order_idx";

-- RenameIndex
ALTER INDEX "idx_ratings_reviewee" RENAME TO "ratings_reviewee_id_idx";

-- RenameIndex
ALTER INDEX "idx_ratings_room_reviewer" RENAME TO "ratings_room_id_reviewer_id_idx";

-- RenameIndex
ALTER INDEX "idx_rp_user_id" RENAME TO "room_participants_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_rpst_tag_id" RENAME TO "room_play_style_tags_tag_id_idx";

-- RenameIndex
ALTER INDEX "idx_rooms_created_at" RENAME TO "rooms_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_rooms_game_id" RENAME TO "rooms_game_id_idx";

-- RenameIndex
ALTER INDEX "idx_rooms_host_id" RENAME TO "rooms_host_id_idx";

-- RenameIndex
ALTER INDEX "idx_rooms_status" RENAME TO "rooms_status_idx";

-- RenameIndex
ALTER INDEX "idx_user_games_game_id" RENAME TO "user_games_game_id_idx";

-- RenameIndex
ALTER INDEX "idx_upst_tag_id" RENAME TO "user_play_style_tags_tag_id_idx";

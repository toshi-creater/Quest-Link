-- DropIndex
DROP INDEX "room_participants_room_id_guest_session_id_key";

-- DropIndex
DROP INDEX "room_participants_room_id_user_id_joined_at_key";

-- AlterTable
ALTER TABLE "games" ALTER COLUMN "igdb_id" DROP NOT NULL;

-- RenameIndex
ALTER INDEX "idx_rp_room_id" RENAME TO "room_participants_room_id_idx";

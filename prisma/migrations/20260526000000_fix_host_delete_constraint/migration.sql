-- AlterTable
ALTER TABLE "rooms" ALTER COLUMN "host_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_host_id_fkey";

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropCheckConstraint: user_id SET NULL 時に違反するため削除
ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chk_user_or_system";

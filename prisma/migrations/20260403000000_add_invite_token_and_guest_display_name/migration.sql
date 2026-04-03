-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "invite_token" VARCHAR(64);

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "display_name" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_invite_token_key" ON "rooms"("invite_token");

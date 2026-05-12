/*
  Warnings:

  - A unique constraint covering the columns `[host_id]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "rooms_host_id_idx";

-- AlterTable
ALTER TABLE "guests" ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_host_id_key" ON "rooms"("host_id");

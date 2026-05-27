-- AlterTable: host_id を nullable に変更
ALTER TABLE "rooms" ALTER COLUMN "host_id" DROP NOT NULL;

-- AlterForeignKey: RESTRICT → SET NULL に変更
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_host_id_fkey";
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_host_id_fkey"
  FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "guest_id" UUID;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_guest_id_fkey'
  ) THEN
    ALTER TABLE "chat_messages"
      ADD CONSTRAINT "chat_messages_guest_id_fkey"
      FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- guest_id 未設定のゲストメッセージ（旧方式: display_name のみ）を削除
DELETE FROM "chat_messages" WHERE user_id IS NULL AND is_system = false AND guest_id IS NULL;

-- CHECK 制約を更新: display_name → guest_id ベースへ
ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chk_user_or_system";
ALTER TABLE "chat_messages" ADD CONSTRAINT "chk_user_or_system"
  CHECK (is_system = true OR user_id IS NOT NULL OR guest_id IS NOT NULL);

ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "display_name";

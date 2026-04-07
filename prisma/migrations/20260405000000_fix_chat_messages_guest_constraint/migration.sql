-- ゲストメッセージ（userId=null, isSystem=false, displayName=非null）を許容するよう制約を修正
ALTER TABLE "chat_messages" DROP CONSTRAINT "chk_user_or_system";
ALTER TABLE "chat_messages" ADD CONSTRAINT "chk_user_or_system"
    CHECK (is_system = true OR user_id IS NOT NULL OR display_name IS NOT NULL);

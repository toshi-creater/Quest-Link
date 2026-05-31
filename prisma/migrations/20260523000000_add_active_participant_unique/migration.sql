-- 同一ユーザーが同じ部屋にアクティブな状態（left_at IS NULL）で二重参加しないよう部分インデックスを追加
CREATE UNIQUE INDEX room_participants_active_unique
ON room_participants (room_id, user_id)
WHERE left_at IS NULL AND user_id IS NOT NULL;

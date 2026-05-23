-- CreateIndex
CREATE INDEX "idx_rooms_game_status_created" ON "rooms"("game_id", "status", "created_at" DESC);

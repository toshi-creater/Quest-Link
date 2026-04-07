CREATE TABLE "guests" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "guest_session_id" VARCHAR(50) NOT NULL,
  "display_name"     VARCHAR(50) NOT NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "guests_guest_session_id_key" ON "guests"("guest_session_id");

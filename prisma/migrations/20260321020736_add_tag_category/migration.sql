-- AlterTable
ALTER TABLE "play_style_tags" ADD COLUMN     "category_id" UUID;

-- CreateTable
CREATE TABLE "tag_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_categories_slug_key" ON "tag_categories"("slug");

-- AddForeignKey
ALTER TABLE "play_style_tags" ADD CONSTRAINT "play_style_tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tag_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

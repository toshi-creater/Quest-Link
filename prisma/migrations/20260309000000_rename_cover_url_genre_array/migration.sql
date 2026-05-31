-- Game.coverUrl → coverImageUrl (cover_url → cover_image_url)
ALTER TABLE "games" RENAME COLUMN "cover_url" TO "cover_image_url";

-- Game.genre: VARCHAR(50) nullable → TEXT[] (genre 配列型へ変更)
ALTER TABLE "games" DROP COLUMN "genre";
ALTER TABLE "games" ADD COLUMN "genre" TEXT[] NOT NULL DEFAULT '{}';

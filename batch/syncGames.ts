import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { fetchTopGames } from "../lib/twitch-client";
import { fetchIgdbGamesByIds, buildCoverImageUrl, type IgdbGame } from "../lib/igdb-client";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("syncGames バッチ開始");

  // Twitch からトップ100取得
  let twitchGames;
  try {
    twitchGames = await fetchTopGames(100);
  } catch (err) {
    console.error("[アラート] Twitch API接続エラー:", err);
    process.exit(1);
  }

  console.log(`Twitch から ${twitchGames.length} 件のゲームを取得`);

  // MAX(display_order) を事前取得
  const maxOrderResult = await prisma.game.aggregate({
    _max: { displayOrder: true },
  });
  let nextOrder = (maxOrderResult._max.displayOrder ?? 0) + 1;

  // 有効な igdbId を収集
  const igdbIds: number[] = [];
  for (const tGame of twitchGames) {
    const igdbId = parseInt(tGame.igdb_id, 10);
    if (!igdbId || isNaN(igdbId)) continue;
    igdbIds.push(igdbId);
  }

  // IGDB API を1回で一括取得
  let igdbMap: Map<number, IgdbGame>;
  try {
    igdbMap = await fetchIgdbGamesByIds(igdbIds);
  } catch (err) {
    console.error("[アラート] IGDB API接続エラー:", err);
    process.exit(1);
  }
  console.log(`IGDB から ${igdbMap.size} 件のゲームを取得`);

  let upsertCount = 0;

  for (const tGame of twitchGames) {
    const igdbId = parseInt(tGame.igdb_id, 10);
    if (!igdbId || isNaN(igdbId)) continue;

    const igdbGame = igdbMap.get(igdbId);
    if (!igdbGame) {
      console.log(`[skip] IGDB該当なし: igdb_id=${igdbId}, name=${tGame.name}`);
      continue;
    }

    const coverImageUrl = igdbGame.cover
      ? buildCoverImageUrl(igdbGame.cover.image_id)
      : null;

    try {
      // 既存レコードの display_order を確認
      const existing = await prisma.game.findUnique({
        where: { igdbId },
        select: { displayOrder: true },
      });

      const currentOrder = existing?.displayOrder ?? nextOrder++;      
      const name = igdbGame.game_localizations?.find(l => l.region === 3)?.name ?? igdbGame.name;
      const genre = igdbGame.genres?.map((g) => g.name) ?? [];

      await prisma.game.upsert({
        where: { igdbId },
        create: {
          igdbId,
          name: name,
          coverImageUrl,
          genre: genre,
          displayOrder: currentOrder,
          cachedAt: new Date(),
        },
        update: {
          name: name,
          coverImageUrl,
          genre: genre,
          cachedAt: new Date(),
          // is_active と display_order は更新しない
        },
      });

      upsertCount++;
    } catch (err) {
      console.error(`[skip] UPSERT失敗 (igdb_id=${igdbId}, name=${igdbGame.name}):`, err);
      // バッチ継続
    }
  }

  console.log(`バッチ完了 ${upsertCount}件登録・更新`);
}

main()
  .catch((err) => {
    console.error("[アラート] バッチエラー:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    void pool.end();
  });

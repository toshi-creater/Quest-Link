import { PrismaClient, RoomStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LOAD_TEST_USER_COUNT = 500;
const LOAD_TEST_ROOM_COUNT = 200;
const MAX_PLAYERS_OPTIONS = [2, 3, 4, 5] as const;

async function main() {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { displayOrder: "asc" },
  });
  if (games.length === 0) {
    throw new Error(
      "ゲームデータがありません。先に pnpm batch:games を実行してください"
    );
  }

  const tags = await prisma.playStyleTag.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  // 50ユーザーを upsert（username は auth.ts の Credentials provider と一致させる）
  const users = await Promise.all(
    Array.from({ length: LOAD_TEST_USER_COUNT }, (_, i) => {
      const n = i + 1;
      const username = `loadtest+${n}`;
      return prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          bio: `負荷テスト用ユーザー #${n}`,
          avgRating: 0,
          ratingCount: 0,
        },
      });
    })
  );

  // 冪等性確保：loadtest ユーザーがホストの部屋を削除してから再作成
  const userIds = users.map((u) => u.id);
  await prisma.room.deleteMany({ where: { hostId: { in: userIds } } });

  // 100部屋を作成（game / status / tags をバランスよく分散）
  const statusCycle: RoomStatus[] = ["waiting", "waiting", "full", "closed"];

  for (let i = 0; i < LOAD_TEST_ROOM_COUNT; i++) {
    const game = games[i % games.length]!;
    const host = users[i % users.length]!;
    const status = statusCycle[i % statusCycle.length]!;
    const maxPlayers = MAX_PLAYERS_OPTIONS[i % MAX_PLAYERS_OPTIONS.length]!;

    // 1〜3個のタグをインデックスのオフセットで選択
    const tagCount = (i % 3) + 1;
    const tagOffset = i % Math.max(tags.length - tagCount + 1, 1);
    const roomTags = tags.slice(tagOffset, tagOffset + tagCount);

    await prisma.room.create({
      data: {
        title: `負荷テスト部屋 ${i + 1}`,
        hostId: host.id,
        gameId: game.id,
        maxPlayers,
        description: `k6 負荷テスト用部屋 #${i + 1}`,
        status,
        closedAt: status === "closed" ? new Date() : null,
        participants: {
          create: { userId: host.id, isHost: true },
        },
        ...(roomTags.length > 0 && {
          playStyleTags: {
            createMany: {
              data: roomTags.map((t) => ({ tagId: t.id })),
            },
          },
        }),
      },
    });
  }

  console.log("✅ 負荷テスト用シードデータの投入が完了しました");
  console.log(`  ユーザー: ${LOAD_TEST_USER_COUNT} 件`);
  console.log(`  部屋: ${LOAD_TEST_ROOM_COUNT} 件`);
  console.log(
    `  ゲーム分散: ${games.map((g) => g.name).join(", ")} (${games.length} 種類)`
  );
  console.log(
    `  ステータス分散: waiting×100, full×50, closed×50 (概算)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

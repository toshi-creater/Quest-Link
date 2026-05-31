import { PrismaClient, RoomStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ジョイナー: 入退室を繰り返すVU用（cookieが必要）
const JOINER_COUNT = 100;
// ホスト: 部屋を保有し続けるユーザー
const HOST_COUNT = 200;
// 部屋数（ホスト1人につき1部屋）
const ROOM_COUNT = HOST_COUNT;
const MAX_PLAYERS_OPTIONS = [2, 3, 4, 5] as const;
// phase6 用: 末尾5部屋は maxPlayers=16 の waiting 部屋として固定
const MAX_CAPACITY_ROOM_COUNT = 5;
const MAX_CAPACITY_PLAYERS = 16;

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

  // ジョイナー (loadtest+1 〜 loadtest+100): 部屋なし
  const joiners = await Promise.all(
    Array.from({ length: JOINER_COUNT }, (_, i) => {
      const n = i + 1;
      const username = `loadtest+${n}`;
      return prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          bio: `負荷テスト ジョイナー #${n}`,
          avgRating: 0,
          ratingCount: 0,
        },
      });
    })
  );

  // ホスト (loadtest+101 〜 loadtest+300): 各自が1部屋を保有
  const hosts = await Promise.all(
    Array.from({ length: HOST_COUNT }, (_, i) => {
      const n = JOINER_COUNT + i + 1;
      const username = `loadtest+${n}`;
      return prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          bio: `負荷テスト ホスト #${n}`,
          avgRating: 0,
          ratingCount: 0,
        },
      });
    })
  );

  // 冪等性確保: ホスト・ジョイナーが関係する部屋を削除してから再作成
  const allUserIds = [...joiners, ...hosts].map((u) => u.id);
  await prisma.room.deleteMany({ where: { hostId: { in: allUserIds } } });

  // 200部屋を作成（ホスト1人につき1部屋、全て status=waiting）
  for (let i = 0; i < ROOM_COUNT; i++) {
    const game = games[i % games.length]!;
    const host = hosts[i]!;

    // 末尾 MAX_CAPACITY_ROOM_COUNT 件は phase6 用に maxPlayers=16 で固定
    const isMaxCapacity = i >= ROOM_COUNT - MAX_CAPACITY_ROOM_COUNT;
    const maxPlayers = isMaxCapacity
      ? MAX_CAPACITY_PLAYERS
      : MAX_PLAYERS_OPTIONS[i % MAX_PLAYERS_OPTIONS.length]!;

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
        status: "waiting" as RoomStatus,
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
  console.log(`  ジョイナー (VU用): ${JOINER_COUNT} 件 (loadtest+1 〜 loadtest+${JOINER_COUNT})`);
  console.log(`  ホスト: ${HOST_COUNT} 件 (loadtest+${JOINER_COUNT + 1} 〜 loadtest+${JOINER_COUNT + HOST_COUNT})`);
  console.log(`  部屋: ${ROOM_COUNT} 件 (全て status=waiting)`);
  console.log(`    通常部屋: maxPlayers=${MAX_PLAYERS_OPTIONS.join("/")} (${ROOM_COUNT - MAX_CAPACITY_ROOM_COUNT} 件)`);
  console.log(`    phase6用: maxPlayers=${MAX_CAPACITY_PLAYERS} (${MAX_CAPACITY_ROOM_COUNT} 件)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

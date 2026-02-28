import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── 1. プレイスタイルタグ ────────────────────────────────────────────────────
  const tagDefs = [
    { name: "ガチ勢", slug: "hardcore", displayOrder: 1 },
    { name: "エンジョイ勢", slug: "casual", displayOrder: 2 },
    { name: "初心者歓迎", slug: "beginner_friendly", displayOrder: 3 },
    { name: "上級者向け", slug: "advanced", displayOrder: 4 },
    { name: "深夜勢", slug: "late_night", displayOrder: 5 },
    { name: "配信者", slug: "streamer", displayOrder: 6 },
  ];

  for (const tag of tagDefs) {
    await prisma.playStyleTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✓ play_style_tags: ${tagDefs.length}件`);

  // ─── 2. ゲームデータ（IGDBキャッシュ） ────────────────────────────────────────
  const gameDefs = [
    {
      igdbId: 126459,
      name: "VALORANT",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.webp",
    },
    {
      igdbId: 101064,
      name: "Apex Legends",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvc.webp",
    },
    {
      igdbId: 119133,
      name: "Overwatch 2",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.webp",
    },
    {
      igdbId: 11198,
      name: "League of Legends",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.webp",
    },
    {
      igdbId: 1905,
      name: "Minecraft",
      coverUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp",
    },
  ];

  const games: { id: string; name: string }[] = [];
  for (const g of gameDefs) {
    const game = await prisma.game.upsert({
      where: { igdbId: g.igdbId },
      update: { name: g.name, coverUrl: g.coverUrl },
      create: g,
    });
    games.push({ id: game.id, name: game.name });
  }
  console.log(`✓ games: ${games.length}件`);

  // ─── 3. テストユーザー ────────────────────────────────────────────────────────
  const userDefs = [
    {
      googleId: "test-google-001",
      username: "gamer_alice",
      bio: "FPS大好きなガチ勢です。ランク上げ一緒にやりましょう！",
      avgRating: 4.5,
      ratingCount: 12,
    },
    {
      googleId: "test-google-002",
      username: "player_bob",
      bio: "エンジョイ勢。深夜によく遊んでます。",
      avgRating: 4.2,
      ratingCount: 8,
    },
    {
      googleId: "test-google-003",
      username: "nova_charlie",
      bio: "初心者ですがよろしくお願いします！",
      avgRating: 3.8,
      ratingCount: 5,
    },
    {
      googleId: "test-google-004",
      username: "pro_diana",
      bio: "元プロゲーマー。コーチングもやってます。",
      avgRating: 4.9,
      ratingCount: 30,
    },
    {
      googleId: "test-google-005",
      username: "midnight_eve",
      bio: "深夜専門。声なしでもOK！",
      avgRating: 4.1,
      ratingCount: 7,
    },
  ];

  const users: { id: string; username: string }[] = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { googleId: u.googleId },
      update: { username: u.username, bio: u.bio },
      create: {
        googleId: u.googleId,
        username: u.username,
        bio: u.bio,
        avgRating: u.avgRating,
        ratingCount: u.ratingCount,
      },
    });
    users.push({ id: user.id, username: user.username });
  }
  console.log(`✓ users: ${users.length}件`);

  // helpers
  const gameId = (name: string) => {
    const g = games.find((g) => g.name === name);
    if (!g) throw new Error(`game not found: ${name}`);
    return g.id;
  };
  const userId = (username: string) => {
    const u = users.find((u) => u.username === username);
    if (!u) throw new Error(`user not found: ${username}`);
    return u.id;
  };
  const tags = await prisma.playStyleTag.findMany({ select: { id: true, slug: true } });
  const tagId = (slug: string) => {
    const t = tags.find((t) => t.slug === slug);
    if (!t) throw new Error(`tag not found: ${slug}`);
    return t.id;
  };

  // ─── 4. 部屋データ ────────────────────────────────────────────────────────────
  // waiting × 4部屋
  const room1 = await prisma.room.create({
    data: {
      title: "深夜VALORANT ランクマ一緒に上げよう",
      gameId: gameId("VALORANT"),
      hostId: userId("gamer_alice"),
      maxPlayers: 5,
      description: "スモーク使える方歓迎！ボイチャあり。プラチナ以上推奨。",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("hardcore") }, { tagId: tagId("late_night") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room1.id, userId: userId("gamer_alice"), isHost: true },
      { roomId: room1.id, userId: userId("player_bob"), isHost: false },
      { roomId: room1.id, userId: userId("nova_charlie"), isHost: false },
    ],
  });

  const room2 = await prisma.room.create({
    data: {
      title: "Apex エンジョイ勢集合！ランク関係なし",
      gameId: gameId("Apex Legends"),
      hostId: userId("player_bob"),
      maxPlayers: 3,
      description: "楽しく遊べる方なら誰でもOK。初心者も歓迎です。",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("casual") }, { tagId: tagId("beginner_friendly") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [{ roomId: room2.id, userId: userId("player_bob"), isHost: true }],
  });

  const room3 = await prisma.room.create({
    data: {
      title: "Overwatch 2 タンク欲しい！マスター帯",
      gameId: gameId("Overwatch 2"),
      hostId: userId("pro_diana"),
      maxPlayers: 6,
      description: "マスター以上限定。真剣にやれる方のみ。",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("hardcore") }, { tagId: tagId("advanced") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room3.id, userId: userId("pro_diana"), isHost: true },
      { roomId: room3.id, userId: userId("gamer_alice"), isHost: false },
    ],
  });

  const room4 = await prisma.room.create({
    data: {
      title: "マイクラ 建築サーバー 初心者歓迎",
      gameId: gameId("Minecraft"),
      hostId: userId("midnight_eve"),
      maxPlayers: 8,
      description: "まったり建築しましょう。声なしOK。",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("casual") }, { tagId: tagId("beginner_friendly") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room4.id, userId: userId("midnight_eve"), isHost: true },
      { roomId: room4.id, userId: userId("nova_charlie"), isHost: false },
    ],
  });

  // playing × 1部屋（一覧には表示されない）
  const room5 = await prisma.room.create({
    data: {
      title: "LoL 5on5 スクリム中",
      gameId: gameId("League of Legends"),
      hostId: userId("pro_diana"),
      maxPlayers: 10,
      status: "playing",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("hardcore") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room5.id, userId: userId("pro_diana"), isHost: true },
      { roomId: room5.id, userId: userId("gamer_alice"), isHost: false },
      { roomId: room5.id, userId: userId("player_bob"), isHost: false },
    ],
  });

  // closed × 1部屋（一覧には表示されない）
  const now = new Date();
  const room6 = await prisma.room.create({
    data: {
      title: "昨日のVALORANT部屋（終了済み）",
      gameId: gameId("VALORANT"),
      hostId: userId("gamer_alice"),
      maxPlayers: 5,
      status: "closed",
      closedAt: now,
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("casual") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room6.id, userId: userId("gamer_alice"), isHost: true, leftAt: now },
      { roomId: room6.id, userId: userId("player_bob"), isHost: false, leftAt: now },
    ],
  });

  console.log(`✓ rooms: 6件（waiting×4, playing×1, closed×1）`);
  console.log("");
  console.log("── AC確認用データ ──────────────────────────────────────────");
  console.log("部屋一覧（waiting）: 4件表示されることを確認");
  console.log("  1. 深夜VALORANT ランクマ（3/5人）← gamer_alice ホスト");
  console.log("  2. Apex エンジョイ勢（1/3人）   ← player_bob ホスト");
  console.log("  3. OW2 タンク欲しい（2/6人）    ← pro_diana ホスト");
  console.log("  4. マイクラ 建築サーバー（2/8人）← midnight_eve ホスト");
  console.log("playing/closed の部屋は一覧に表示されない");
  console.log("────────────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

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

  // ─── 2. ゲームデータ（DBから取得） ───────────────────────────────────────────
  const games = await prisma.game.findMany({
    select: { id: true, name: true },
  });
  if (games.length === 0) {
    throw new Error(
      "ゲームデータが存在しません。先に syncGames を実行してください。"
    );
  }
  console.log(`✓ games: ${games.length}件（既存データ使用）`);

  // ─── 3. テストユーザー ────────────────────────────────────────────────────────
  const userDefs = [
    {
      username: "gamer_alice",
      bio: "FPS大好きなガチ勢です。ランク上げ一緒にやりましょう！",
      avgRating: 4.5,
      ratingCount: 12,
      tags: ["hardcore", "late_night"],
    },
    {
      username: "player_bob",
      bio: "エンジョイ勢。深夜によく遊んでます。",
      avgRating: 4.2,
      ratingCount: 8,
      tags: ["casual", "late_night"],
    },
    {
      username: "nova_charlie",
      bio: "初心者ですがよろしくお願いします！",
      avgRating: 3.8,
      ratingCount: 5,
      tags: ["casual", "beginner_friendly"],
    },
    {
      username: "pro_diana",
      bio: "元プロゲーマー。コーチングもやってます。",
      avgRating: 4.9,
      ratingCount: 30,
      tags: ["hardcore", "advanced"],
    },
    {
      username: "midnight_eve",
      bio: "深夜専門。声なしでもOK！",
      avgRating: 4.1,
      ratingCount: 7,
      tags: ["casual", "late_night"],
    },
    {
      username: "swift_ryota",
      bio: "配信しながらゲームしてます。見に来てね！",
      avgRating: 4.3,
      ratingCount: 15,
      tags: ["streamer", "casual"],
    },
    {
      username: "cyber_nao",
      bio: "MMOが好き。FFXIVメインです。深夜勢。",
      avgRating: 4.6,
      ratingCount: 22,
      tags: ["casual", "late_night"],
    },
    {
      username: "rage_kenta",
      bio: "勝ちにこだわります。雑談NG。",
      avgRating: 3.5,
      ratingCount: 9,
      tags: ["hardcore", "advanced"],
    },
  ];

  const tags = await prisma.playStyleTag.findMany({
    select: { id: true, slug: true },
  });
  const tagId = (slug: string) => {
    const t = tags.find((t) => t.slug === slug);
    if (!t) throw new Error(`tag not found: ${slug}`);
    return t.id;
  };

  const users: { id: string; username: string }[] = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { bio: u.bio },
      create: {
        username: u.username,
        bio: u.bio,
        avgRating: u.avgRating,
        ratingCount: u.ratingCount,
      },
    });
    users.push({ id: user.id, username: user.username });

    // UserPlayStyleTag を upsert
    for (const slug of u.tags) {
      await prisma.userPlayStyleTag.upsert({
        where: { userId_tagId: { userId: user.id, tagId: tagId(slug) } },
        update: {},
        create: { userId: user.id, tagId: tagId(slug) },
      });
    }
  }
  console.log(`✓ users: ${users.length}件`);

  // helpers
  const gameId = (name: string) => {
    const g = games.find((g) => g.name === name);
    if (!g) {
      console.warn(`game not found: ${name} → fallback to games[0]`);
      return games[0]!.id;
    }
    return g.id;
  };
  const userId = (username: string) => {
    const u = users.find((u) => u.username === username);
    if (!u) throw new Error(`user not found: ${username}`);
    return u.id;
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
          data: [
            { tagId: tagId("casual") },
            { tagId: tagId("beginner_friendly") },
          ],
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
          data: [
            { tagId: tagId("casual") },
            { tagId: tagId("beginner_friendly") },
          ],
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

  // waiting × 3部屋（新規追加）
  const room7 = await prisma.room.create({
    data: {
      title: "Apex 深夜ランクマ！配信しながら",
      gameId: gameId("Apex Legends"),
      hostId: userId("swift_ryota"),
      maxPlayers: 3,
      description: "配信しながらランクマします。雑談しながらまったりと！",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("streamer") }, { tagId: tagId("late_night") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room7.id, userId: userId("swift_ryota"), isHost: true },
      { roomId: room7.id, userId: userId("midnight_eve"), isHost: false },
    ],
  });

  const room8 = await prisma.room.create({
    data: {
      title: "LoL ARAM 気軽に遊ぼう",
      gameId: gameId("League of Legends"),
      hostId: userId("cyber_nao"),
      maxPlayers: 10,
      description: "ARAMで気軽に遊びましょう。ランク不問、声なしOK。",
      status: "waiting",
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("casual") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      { roomId: room8.id, userId: userId("cyber_nao"), isHost: true },
      { roomId: room8.id, userId: userId("player_bob"), isHost: false },
    ],
  });

  const room9 = await prisma.room.create({
    data: {
      title: "VALORANT ガチ勢のみ Diamond+",
      gameId: gameId("VALORANT"),
      hostId: userId("rage_kenta"),
      maxPlayers: 5,
      description: "ダイヤ以上限定。無駄な会話なし。勝ちに行きます。",
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
      { roomId: room9.id, userId: userId("rage_kenta"), isHost: true },
      { roomId: room9.id, userId: userId("pro_diana"), isHost: false },
    ],
  });

  // full × 1部屋
  const room5 = await prisma.room.create({
    data: {
      title: "LoL 5on5 スクリム中",
      gameId: gameId("League of Legends"),
      hostId: userId("pro_diana"),
      maxPlayers: 10,
      status: "full",
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

  // closed × 2部屋
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
      {
        roomId: room6.id,
        userId: userId("gamer_alice"),
        isHost: true,
        leftAt: now,
      },
      {
        roomId: room6.id,
        userId: userId("player_bob"),
        isHost: false,
        leftAt: now,
      },
    ],
  });

  const room10 = await prisma.room.create({
    data: {
      title: "OW2 昨日の練習部屋（終了済み）",
      gameId: gameId("Overwatch 2"),
      hostId: userId("swift_ryota"),
      maxPlayers: 6,
      status: "closed",
      closedAt: now,
      playStyleTags: {
        createMany: {
          data: [{ tagId: tagId("streamer") }],
        },
      },
    },
  });
  await prisma.roomParticipant.createMany({
    data: [
      {
        roomId: room10.id,
        userId: userId("swift_ryota"),
        isHost: true,
        leftAt: now,
      },
      {
        roomId: room10.id,
        userId: userId("cyber_nao"),
        isHost: false,
        leftAt: now,
      },
    ],
  });

  // suppress unused variable warnings
  void room1;
  void room2;
  void room3;
  void room4;
  void room5;
  void room6;
  void room7;
  void room8;
  void room9;
  void room10;

  console.log(`✓ rooms: 10件（waiting×7, full×1, closed×2）`);
  console.log("");
  console.log("── AC確認用データ ──────────────────────────────────────────");
  console.log("部屋一覧（waiting）: 7件表示されることを確認");
  console.log("  1. 深夜VALORANT ランクマ（3/5人）    ← gamer_alice ホスト");
  console.log("  2. Apex エンジョイ勢（1/3人）        ← player_bob ホスト");
  console.log("  3. OW2 タンク欲しい（2/6人）         ← pro_diana ホスト");
  console.log("  4. マイクラ 建築サーバー（2/8人）    ← midnight_eve ホスト");
  console.log("  5. Apex 深夜ランクマ！配信しながら（2/3人） ← swift_ryota ホスト");
  console.log("  6. LoL ARAM 気軽に遊ぼう（2/10人）   ← cyber_nao ホスト");
  console.log("  7. VALORANT ガチ勢のみ（2/5人）      ← rage_kenta ホスト");
  console.log("full/closed の部屋は一覧に表示されない");
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

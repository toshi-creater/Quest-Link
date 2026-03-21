import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── 0. タグカテゴリ ──────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "プレイスタイル", slug: "play_style", displayOrder: 1 },
    { name: "時間帯", slug: "schedule", displayOrder: 2 },
    { name: "コミュニケーション", slug: "communication", displayOrder: 3 },
    { name: "参加条件", slug: "restriction", displayOrder: 4 },
    { name: "プラットフォーム", slug: "platform", displayOrder: 5 },
  ];

  for (const cat of categoryDefs) {
    await prisma.tagCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ tag_categories: ${categoryDefs.length}件`);

  const categories = await prisma.tagCategory.findMany({
    select: { id: true, slug: true },
  });
  const categoryId = (slug: string) => {
    const c = categories.find((c) => c.slug === slug);
    if (!c) throw new Error(`category not found: ${slug}`);
    return c.id;
  };

  // ─── 1. プレイスタイルタグ ────────────────────────────────────────────────────
  const tagDefs = [
    { name: "ガチ勢", slug: "hardcore", displayOrder: 1, categorySlug: "play_style" },
    { name: "エンジョイ勢", slug: "casual", displayOrder: 2, categorySlug: "play_style" },
    { name: "初心者歓迎", slug: "beginner_friendly", displayOrder: 3, categorySlug: "play_style" },
    { name: "上級者向け", slug: "advanced", displayOrder: 4, categorySlug: "play_style" },
    { name: "深夜勢", slug: "late_night", displayOrder: 5, categorySlug: "schedule" },
    { name: "配信者", slug: "streamer", displayOrder: 6, categorySlug: "communication" },
    { name: "ボイチャあり", slug: "voice_chat", displayOrder: 7, categorySlug: "communication" },
    { name: "テキストのみ", slug: "text_only", displayOrder: 8, categorySlug: "communication" },
    { name: "女性限定", slug: "female_only", displayOrder: 9, categorySlug: "restriction" },
    { name: "社会人限定", slug: "adult_only", displayOrder: 10, categorySlug: "restriction" },
    { name: "学生歓迎", slug: "student", displayOrder: 11, categorySlug: "restriction" },
    { name: "朝活勢", slug: "morning", displayOrder: 12, categorySlug: "schedule" },
    { name: "週末限定", slug: "weekend", displayOrder: 13, categorySlug: "schedule" },
    { name: "コーチング可", slug: "coach", displayOrder: 14, categorySlug: "play_style" },
    { name: "PC", slug: "platform_pc", displayOrder: 15, categorySlug: "platform" },
    { name: "PlayStation", slug: "platform_ps", displayOrder: 16, categorySlug: "platform" },
    { name: "Xbox", slug: "platform_xbox", displayOrder: 17, categorySlug: "platform" },
    { name: "Nintendo Switch", slug: "platform_switch", displayOrder: 18, categorySlug: "platform" },
    { name: "スマホ", slug: "platform_mobile", displayOrder: 19, categorySlug: "platform" },
  ];

  for (const tag of tagDefs) {
    const { categorySlug, ...rest } = tag;
    await prisma.playStyleTag.upsert({
      where: { slug: rest.slug },
      update: { categoryId: categoryId(categorySlug) },
      create: { ...rest, categoryId: categoryId(categorySlug) },
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
    // 既存 8件
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
    // 追加 22件
    {
      username: "sakura_fps",
      bio: "VALORANTメイン。イモータル帯です。ボイチャ必須！",
      avgRating: 4.7,
      ratingCount: 18,
      tags: ["hardcore", "voice_chat", "platform_pc"],
    },
    {
      username: "thunder_kai",
      bio: "Apex Legends大好き。プレデター目指して深夜ランクマ中。",
      avgRating: 4.4,
      ratingCount: 25,
      tags: ["hardcore", "late_night", "platform_pc"],
    },
    {
      username: "pixel_luna",
      bio: "マイクラとインディーゲームが好きです。週末によく遊んでます！",
      avgRating: 4.0,
      ratingCount: 6,
      tags: ["casual", "weekend"],
    },
    {
      username: "neon_taka",
      bio: "LoLとTFTをメインにしてます。ARAM大好き。",
      avgRating: 4.2,
      ratingCount: 11,
      tags: ["casual", "voice_chat"],
    },
    {
      username: "frost_miku",
      bio: "OW2タンクメイン。女性ゲーマーで活動中。ボイチャあり。",
      avgRating: 4.6,
      ratingCount: 14,
      tags: ["casual", "female_only", "voice_chat"],
    },
    {
      username: "blade_yuki",
      bio: "VALORANT上級者。エージェント：ジェット・レイナ。ガチ勢。",
      avgRating: 4.8,
      ratingCount: 35,
      tags: ["hardcore", "advanced", "platform_pc"],
    },
    {
      username: "echo_hana",
      bio: "FFXIVメインコンテンツは零式。MMO歴10年。テキストチャットのみ。",
      avgRating: 4.5,
      ratingCount: 20,
      tags: ["casual", "text_only", "late_night"],
    },
    {
      username: "storm_jin",
      bio: "Fortniteメイン。配信しながらやってます。初心者さんも大歓迎！",
      avgRating: 4.1,
      ratingCount: 9,
      tags: ["streamer", "beginner_friendly"],
    },
    {
      username: "crystal_rui",
      bio: "原神とスマホゲー中心。まったり遊ぶのが好きです。",
      avgRating: 3.9,
      ratingCount: 4,
      tags: ["casual", "platform_mobile"],
    },
    {
      username: "shadow_ren",
      bio: "深夜専門のソロプレイヤー。ランクマ好き。声なし希望。",
      avgRating: 4.0,
      ratingCount: 10,
      tags: ["hardcore", "late_night", "text_only"],
    },
    {
      username: "burst_sora",
      bio: "朝活ゲーマー！Apexと配信を組み合わせて活動中。",
      avgRating: 4.3,
      ratingCount: 13,
      tags: ["streamer", "morning"],
    },
    {
      username: "delta_mei",
      bio: "ゲーム始めたばかりの初心者です。優しく教えてください！",
      avgRating: 3.2,
      ratingCount: 2,
      tags: ["casual", "beginner_friendly", "student"],
    },
    {
      username: "omega_ryu",
      bio: "複数FPSでコーチング実績あり。上達したい方はDMください。",
      avgRating: 4.9,
      ratingCount: 42,
      tags: ["hardcore", "advanced", "coach"],
    },
    {
      username: "starlight_ai",
      bio: "朝活勢！6時〜8時に活動中。まったりエンジョイが好き。",
      avgRating: 4.2,
      ratingCount: 8,
      tags: ["casual", "morning"],
    },
    {
      username: "lunar_kei",
      bio: "大学生ゲーマー。放課後によく活動。初心者に優しい部屋を探してます。",
      avgRating: 3.6,
      ratingCount: 3,
      tags: ["casual", "beginner_friendly", "student"],
    },
    {
      username: "phoenix_dai",
      bio: "FPSコーチ歴3年。VALORANTとApexが得意。上達サポートします！",
      avgRating: 4.8,
      ratingCount: 38,
      tags: ["hardcore", "coach", "platform_pc"],
    },
    {
      username: "venom_akira",
      bio: "PC一筋10年。FPS全般ガチ勢。深夜しか動けません。",
      avgRating: 4.4,
      ratingCount: 28,
      tags: ["hardcore", "late_night", "platform_pc"],
    },
    {
      username: "aurora_nana",
      bio: "週末ゲーマー。土日限定で活動中。エンジョイが一番！",
      avgRating: 4.0,
      ratingCount: 5,
      tags: ["casual", "weekend"],
    },
    {
      username: "zenith_tomo",
      bio: "ボイチャ大好き。LoLとOW2をメインにしてる社会人ゲーマー。",
      avgRating: 4.3,
      ratingCount: 16,
      tags: ["casual", "voice_chat", "adult_only"],
    },
    {
      username: "crimson_yui",
      bio: "女性ゲーマーです。女性限定の部屋を好んでいます。OW2メイン。",
      avgRating: 4.5,
      ratingCount: 12,
      tags: ["casual", "female_only", "voice_chat"],
    },
    {
      username: "azure_shun",
      bio: "Switch勢！スプラ3とマリオカートがメイン。まったり楽しく！",
      avgRating: 3.8,
      ratingCount: 7,
      tags: ["casual", "platform_switch"],
    },
    {
      username: "vertex_rio",
      bio: "Switchとスマホでゲームしてる学生です。スプラ3大好き！",
      avgRating: 3.5,
      ratingCount: 3,
      tags: ["casual", "platform_switch", "student"],
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
  type RoomStatus = "waiting" | "full" | "closed";
  type RoomDef = {
    title: string;
    game: string;
    host: string;
    maxPlayers: number;
    description?: string;
    status: RoomStatus;
    tags: string[];
    members: string[]; // ホスト含む全参加者
  };

  const now = new Date();

  const roomDefs: RoomDef[] = [
    // ── waiting × 30 ──────────────────────────────────────────────────────────
    {
      title: "深夜VALORANT ランクマ一緒に上げよう",
      game: "Valorant",
      host: "gamer_alice",
      maxPlayers: 5,
      description: "スモーク使える方歓迎！ボイチャあり。プラチナ以上推奨。",
      status: "waiting",
      tags: ["hardcore", "late_night"],
      members: ["gamer_alice", "player_bob", "nova_charlie"],
    },
    {
      title: "Apex エンジョイ勢集合！ランク関係なし",
      game: "エーペックスレジェンズ",
      host: "player_bob",
      maxPlayers: 3,
      description: "楽しく遊べる方なら誰でもOK。初心者も歓迎です。",
      status: "waiting",
      tags: ["casual", "beginner_friendly"],
      members: ["player_bob"],
    },
    {
      title: "Overwatch 2 タンク欲しい！マスター帯",
      game: "オーバーウォッチ",
      host: "pro_diana",
      maxPlayers: 6,
      description: "マスター以上限定。真剣にやれる方のみ。",
      status: "waiting",
      tags: ["hardcore", "advanced"],
      members: ["pro_diana", "gamer_alice"],
    },
    {
      title: "マイクラ 建築サーバー 初心者歓迎",
      game: "Rust",
      host: "midnight_eve",
      maxPlayers: 8,
      description: "まったり建築しましょう。声なしOK。",
      status: "waiting",
      tags: ["casual", "beginner_friendly"],
      members: ["midnight_eve", "nova_charlie"],
    },
    {
      title: "Apex 深夜ランクマ！配信しながら",
      game: "エーペックスレジェンズ",
      host: "swift_ryota",
      maxPlayers: 3,
      description: "配信しながらランクマします。雑談しながらまったりと！",
      status: "waiting",
      tags: ["streamer", "late_night"],
      members: ["swift_ryota", "midnight_eve"],
    },
    {
      title: "LoL ARAM 気軽に遊ぼう",
      game: "リーグ オブ レジェンド",
      host: "cyber_nao",
      maxPlayers: 10,
      description: "ARAMで気軽に遊びましょう。ランク不問、声なしOK。",
      status: "waiting",
      tags: ["casual"],
      members: ["cyber_nao", "player_bob"],
    },
    {
      title: "VALORANT ガチ勢のみ Diamond+",
      game: "Valorant",
      host: "rage_kenta",
      maxPlayers: 5,
      description: "ダイヤ以上限定。無駄な会話なし。勝ちに行きます。",
      status: "waiting",
      tags: ["hardcore", "advanced"],
      members: ["rage_kenta", "pro_diana"],
    },
    {
      title: "VALORANT イモータル帯 ボイチャあり",
      game: "Valorant",
      host: "sakura_fps",
      maxPlayers: 5,
      description: "イモータル以上限定。ボイチャ必須です。デュエリスト歓迎。",
      status: "waiting",
      tags: ["hardcore", "voice_chat", "platform_pc"],
      members: ["sakura_fps", "blade_yuki"],
    },
    {
      title: "Apex プレデター目指す深夜部屋",
      game: "エーペックスレジェンズ",
      host: "thunder_kai",
      maxPlayers: 3,
      description: "本気でプレデター目指してます。深夜0時〜。PCのみ。",
      status: "waiting",
      tags: ["hardcore", "late_night", "platform_pc"],
      members: ["thunder_kai"],
    },
    {
      title: "マイクラ 週末まったり建築",
      game: "Rust",
      host: "pixel_luna",
      maxPlayers: 6,
      description: "週末だけ活動の建築勢。初心者さんも大歓迎！",
      status: "waiting",
      tags: ["casual", "weekend", "beginner_friendly"],
      members: ["pixel_luna", "aurora_nana"],
    },
    {
      title: "LoL ARAMフルパ 声あり歓迎",
      game: "リーグ オブ レジェンド",
      host: "neon_taka",
      maxPlayers: 5,
      description: "ARAMをボイチャしながら楽しみましょう。ランク不問。",
      status: "waiting",
      tags: ["casual", "voice_chat"],
      members: ["neon_taka", "zenith_tomo"],
    },
    {
      title: "OW2 女性限定ルーム タンク・サポ歓迎",
      game: "オーバーウォッチ",
      host: "frost_miku",
      maxPlayers: 6,
      description: "女性ゲーマー限定。ランク不問でわいわい遊びましょう！",
      status: "waiting",
      tags: ["casual", "female_only", "voice_chat"],
      members: ["frost_miku", "crimson_yui"],
    },
    {
      title: "VALORANT コーチング付き練習部屋",
      game: "Valorant",
      host: "omega_ryu",
      maxPlayers: 5,
      description: "コーチングしながら一緒に練習します。シルバー〜プラチナ帯歓迎。",
      status: "waiting",
      tags: ["coach", "advanced"],
      members: ["omega_ryu", "phoenix_dai", "delta_mei"],
    },
    {
      title: "Fortnite 配信コラボ募集",
      game: "フォートナイト",
      host: "storm_jin",
      maxPlayers: 4,
      description: "配信しながらFortniteやります。コラボ大歓迎！",
      status: "waiting",
      tags: ["streamer", "casual"],
      members: ["storm_jin", "swift_ryota"],
    },
    {
      title: "原神 協力クエスト一緒にやろう",
      game: "原神",
      host: "crystal_rui",
      maxPlayers: 4,
      description: "原神の協力クエストを一緒にクリアしましょう。スマホOK。",
      status: "waiting",
      tags: ["casual", "platform_mobile"],
      members: ["crystal_rui"],
    },
    {
      title: "FFXIV 零式 固定メンバー募集",
      game: "Final Fantasy XIV Online",
      host: "echo_hana",
      maxPlayers: 8,
      description: "零式固定メンバー募集中。テキストチャットのみ。経験者優先。",
      status: "waiting",
      tags: ["hardcore", "text_only", "late_night"],
      members: ["echo_hana", "cyber_nao"],
    },
    {
      title: "Apex 朝活ランクマ！モーニング勢",
      game: "エーペックスレジェンズ",
      host: "burst_sora",
      maxPlayers: 3,
      description: "朝6時〜8時に活動。一緒に朝活しましょう！",
      status: "waiting",
      tags: ["morning", "casual"],
      members: ["burst_sora", "starlight_ai"],
    },
    {
      title: "スプラトゥーン3 Xマッチ Switch勢",
      game: "マーベル・ライバルズ",
      host: "azure_shun",
      maxPlayers: 4,
      description: "スプラXマッチをSwitch勢で。まったり楽しもう！",
      status: "waiting",
      tags: ["casual", "platform_switch"],
      members: ["azure_shun", "vertex_rio"],
    },
    {
      title: "学生ゲーマー歓迎 Apex エンジョイ",
      game: "エーペックスレジェンズ",
      host: "lunar_kei",
      maxPlayers: 3,
      description: "学生同士でApexを楽しみましょう。初心者歓迎！",
      status: "waiting",
      tags: ["student", "beginner_friendly", "casual"],
      members: ["lunar_kei", "delta_mei"],
    },
    {
      title: "FFXIV 深夜 テキストチャット限定",
      game: "Final Fantasy XIV Online",
      host: "shadow_ren",
      maxPlayers: 4,
      description: "深夜のFFXIV。テキストのみ、ゆったりやりましょう。",
      status: "waiting",
      tags: ["late_night", "text_only"],
      members: ["shadow_ren", "echo_hana"],
    },
    {
      title: "Call of Duty 上級者ランクマ",
      game: "Call of Duty: Black Ops 7",
      host: "venom_akira",
      maxPlayers: 4,
      description: "CoD深夜ランク。PC限定、ガチ勢のみ。",
      status: "waiting",
      tags: ["hardcore", "late_night", "platform_pc"],
      members: ["venom_akira", "rage_kenta"],
    },
    {
      title: "OW2 マスター帯 スクリム練習",
      game: "オーバーウォッチ",
      host: "pro_diana",
      maxPlayers: 6,
      description: "マスター帯でスクリム形式の練習。各ロール1名ずつ。",
      status: "waiting",
      tags: ["hardcore", "advanced"],
      members: ["pro_diana"],
    },
    {
      title: "週末限定 原神 まったり探索",
      game: "原神",
      host: "aurora_nana",
      maxPlayers: 4,
      description: "週末に原神の世界をゆっくり探索。スマホでもOK！",
      status: "waiting",
      tags: ["casual", "weekend", "platform_mobile"],
      members: ["aurora_nana", "crystal_rui"],
    },
    {
      title: "社会人ゲーマーのLoL ARAMたまり場",
      game: "リーグ オブ レジェンド",
      host: "zenith_tomo",
      maxPlayers: 5,
      description: "社会人限定のゆるいARAM部屋。ボイチャあり。",
      status: "waiting",
      tags: ["casual", "adult_only", "voice_chat"],
      members: ["zenith_tomo", "neon_taka", "cyber_nao"],
    },
    {
      title: "VALORANT 初心者コーチング付き",
      game: "Valorant",
      host: "phoenix_dai",
      maxPlayers: 5,
      description: "初心者向けコーチング部屋。一緒に上達しましょう！",
      status: "waiting",
      tags: ["coach", "beginner_friendly"],
      members: ["phoenix_dai", "delta_mei", "lunar_kei"],
    },
    {
      title: "OW2 女性フレンド募集 エンジョイ",
      game: "オーバーウォッチ",
      host: "crimson_yui",
      maxPlayers: 6,
      description: "女性同士でOW2をエンジョイしましょう。ボイチャあり。",
      status: "waiting",
      tags: ["casual", "female_only", "voice_chat"],
      members: ["crimson_yui", "frost_miku"],
    },
    {
      title: "Minecraft 朝活サバイバル",
      game: "Rust",
      host: "starlight_ai",
      maxPlayers: 4,
      description: "朝活でマイクラサバイバル。6時〜8時に活動します！",
      status: "waiting",
      tags: ["casual", "morning"],
      members: ["starlight_ai"],
    },
    {
      title: "スプラ3 学生フレンド募集",
      game: "マーベル・ライバルズ",
      host: "vertex_rio",
      maxPlayers: 4,
      description: "学生同士でスプラ3をがっつりやろう！Switch勢。",
      status: "waiting",
      tags: ["casual", "student", "platform_switch"],
      members: ["vertex_rio", "azure_shun", "lunar_kei"],
    },
    {
      title: "Apex フルパ チャンピオン狙い",
      game: "エーペックスレジェンズ",
      host: "sakura_fps",
      maxPlayers: 3,
      description: "Apexでチャンピオン狙います。プラチナ以上歓迎。ボイチャあり。",
      status: "waiting",
      tags: ["hardcore", "voice_chat"],
      members: ["sakura_fps", "thunder_kai"],
    },
    {
      title: "ELDEN RING 協力プレイ初見さん歓迎",
      game: "エルデンリング",
      host: "nova_charlie",
      maxPlayers: 2,
      description: "エルデンリングをまったり協力プレイ。初見でも大丈夫！",
      status: "waiting",
      tags: ["casual", "beginner_friendly"],
      members: ["nova_charlie"],
    },
    {
      title: "CoD Warzone PC ランクマ",
      game: "Call of Duty: Black Ops 7",
      host: "gamer_alice",
      maxPlayers: 3,
      description: "Warzone PC勢でランクマ。プラチナ以上歓迎。",
      status: "waiting",
      tags: ["hardcore", "platform_pc"],
      members: ["gamer_alice"],
    },
    // ── full × 8 ─────────────────────────────────────────────────────────────
    {
      title: "LoL 5on5 スクリム中",
      game: "リーグ オブ レジェンド",
      host: "pro_diana",
      maxPlayers: 5,
      description: "スクリム中につき満員です。",
      status: "full",
      tags: ["hardcore"],
      members: ["pro_diana", "gamer_alice", "player_bob", "rage_kenta", "blade_yuki"],
    },
    {
      title: "VALORANT 5人フルパ ランクマ",
      game: "Valorant",
      host: "gamer_alice",
      maxPlayers: 5,
      description: "フルパでランクマ中！",
      status: "full",
      tags: ["hardcore", "voice_chat"],
      members: [
        "gamer_alice",
        "sakura_fps",
        "blade_yuki",
        "omega_ryu",
        "venom_akira",
      ],
    },
    {
      title: "Apex トリオ ランク中",
      game: "エーペックスレジェンズ",
      host: "thunder_kai",
      maxPlayers: 3,
      description: "フルパでランクマ中。",
      status: "full",
      tags: ["hardcore", "late_night"],
      members: ["thunder_kai", "rage_kenta", "shadow_ren"],
    },
    {
      title: "OW2 6人フル 練習中",
      game: "オーバーウォッチ",
      host: "frost_miku",
      maxPlayers: 6,
      description: "6人集まりました！",
      status: "full",
      tags: ["casual", "voice_chat"],
      members: [
        "frost_miku",
        "crimson_yui",
        "zenith_tomo",
        "neon_taka",
        "cyber_nao",
        "player_bob",
      ],
    },
    {
      title: "FFXIV 零式 固定8人 攻略中",
      game: "Final Fantasy XIV Online",
      host: "echo_hana",
      maxPlayers: 8,
      description: "固定メンバー8名で攻略中です。",
      status: "full",
      tags: ["hardcore", "text_only"],
      members: [
        "echo_hana",
        "cyber_nao",
        "shadow_ren",
        "midnight_eve",
        "pro_diana",
        "gamer_alice",
        "swift_ryota",
        "starlight_ai",
      ],
    },
    {
      title: "マイクラ サーバー満員",
      game: "Rust",
      host: "pixel_luna",
      maxPlayers: 4,
      description: "本日は満員です。",
      status: "full",
      tags: ["casual"],
      members: ["pixel_luna", "aurora_nana", "delta_mei", "lunar_kei"],
    },
    {
      title: "Fortnite スクワッド満員",
      game: "フォートナイト",
      host: "storm_jin",
      maxPlayers: 4,
      description: "4人揃いました！",
      status: "full",
      tags: ["casual", "streamer"],
      members: ["storm_jin", "swift_ryota", "burst_sora", "player_bob"],
    },
    {
      title: "スプラ3 4人フルパ Xマッチ中",
      game: "マーベル・ライバルズ",
      host: "azure_shun",
      maxPlayers: 4,
      description: "4人揃ってXマッチ中！",
      status: "full",
      tags: ["casual", "platform_switch"],
      members: ["azure_shun", "vertex_rio", "lunar_kei", "aurora_nana"],
    },
    // ── closed × 12 ──────────────────────────────────────────────────────────
    {
      title: "昨日のVALORANT部屋（終了済み）",
      game: "Valorant",
      host: "gamer_alice",
      maxPlayers: 5,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["gamer_alice", "player_bob"],
    },
    {
      title: "OW2 昨日の練習部屋（終了済み）",
      game: "オーバーウォッチ",
      host: "swift_ryota",
      maxPlayers: 6,
      description: "",
      status: "closed",
      tags: ["streamer"],
      members: ["swift_ryota", "cyber_nao"],
    },
    {
      title: "Apex 先週のランクマ（終了）",
      game: "エーペックスレジェンズ",
      host: "thunder_kai",
      maxPlayers: 3,
      description: "",
      status: "closed",
      tags: ["hardcore"],
      members: ["thunder_kai", "rage_kenta", "venom_akira"],
    },
    {
      title: "LoL ARAM終了部屋",
      game: "リーグ オブ レジェンド",
      host: "neon_taka",
      maxPlayers: 5,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["neon_taka", "zenith_tomo", "cyber_nao"],
    },
    {
      title: "VALORANT コーチング終了",
      game: "Valorant",
      host: "omega_ryu",
      maxPlayers: 5,
      description: "",
      status: "closed",
      tags: ["coach"],
      members: ["omega_ryu", "delta_mei"],
    },
    {
      title: "マイクラ 建築大会（終了）",
      game: "Rust",
      host: "pixel_luna",
      maxPlayers: 8,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["pixel_luna", "starlight_ai", "aurora_nana", "nova_charlie"],
    },
    {
      title: "FFXIV 週末ダンジョン（終了）",
      game: "Final Fantasy XIV Online",
      host: "echo_hana",
      maxPlayers: 4,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["echo_hana", "shadow_ren"],
    },
    {
      title: "Fortnite 深夜デュオ（終了）",
      game: "フォートナイト",
      host: "storm_jin",
      maxPlayers: 2,
      description: "",
      status: "closed",
      tags: ["streamer"],
      members: ["storm_jin", "burst_sora"],
    },
    {
      title: "スプラ3 ナワバリ練習（終了）",
      game: "マーベル・ライバルズ",
      host: "vertex_rio",
      maxPlayers: 4,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["vertex_rio", "azure_shun"],
    },
    {
      title: "原神 協力クエスト（終了）",
      game: "原神",
      host: "crystal_rui",
      maxPlayers: 4,
      description: "",
      status: "closed",
      tags: ["casual"],
      members: ["crystal_rui", "aurora_nana"],
    },
    {
      title: "Apex コーチング終了部屋",
      game: "エーペックスレジェンズ",
      host: "phoenix_dai",
      maxPlayers: 3,
      description: "",
      status: "closed",
      tags: ["coach"],
      members: ["phoenix_dai", "lunar_kei"],
    },
    {
      title: "Call of Duty 深夜部屋（終了）",
      game: "Call of Duty: Black Ops 7",
      host: "venom_akira",
      maxPlayers: 4,
      description: "",
      status: "closed",
      tags: ["hardcore", "late_night"],
      members: ["venom_akira", "rage_kenta", "shadow_ren"],
    },
  ];

  let waitingCount = 0;
  let fullCount = 0;
  let closedCount = 0;

  for (const def of roomDefs) {
    const room = await prisma.room.create({
      data: {
        title: def.title,
        gameId: gameId(def.game),
        hostId: userId(def.host),
        maxPlayers: def.maxPlayers,
        description: def.description,
        status: def.status,
        ...(def.status === "closed" ? { closedAt: now } : {}),
        playStyleTags: {
          createMany: {
            data: def.tags.map((slug) => ({ tagId: tagId(slug) })),
          },
        },
      },
    });

    await prisma.roomParticipant.createMany({
      data: def.members.map((username) => ({
        roomId: room.id,
        userId: userId(username),
        isHost: username === def.host,
        ...(def.status === "closed" ? { leftAt: now } : {}),
      })),
    });

    if (def.status === "waiting") waitingCount++;
    else if (def.status === "full") fullCount++;
    else closedCount++;
  }

  console.log(
    `✓ rooms: ${roomDefs.length}件（waiting×${waitingCount}, full×${fullCount}, closed×${closedCount}）`
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

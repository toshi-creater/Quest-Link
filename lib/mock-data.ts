// ─── 型定義 ─────────────────────────────────────────────────────────────────

export type PlayStyleTag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

export type Game = {
  id: string;
  name: string;
  coverImageUrl: string | null;
};

export type User = {
  id: string;
  username: string;
  iconUrl: string | null;
  bio: string | null;
  avgRating: number | null;
  ratingCount: number;
  playStyleTags: PlayStyleTag[];
  games: Game[];
};

export type Room = {
  id: string;
  title: string;
  game: Game;
  description: string | null;
  maxPlayers: number;
  currentPlayers: number;
  status: "waiting" | "full" | "closed";
  playStyleTags: PlayStyleTag[];
  host: {
    id: string;
    username: string;
    iconUrl: string | null;
    avgRating: number | null;
  };
  participants: {
    userId: string;
    username: string;
    iconUrl: string | null;
    avgRating: number | null;
    isHost: boolean;
    joinedAt: string;
  }[];
  createdAt: string;
  closedAt: string | null;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  user: { id: string; username: string; iconUrl: string | null } | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
};

export type Rating = {
  id: string;
  roomId: string;
  reviewer: { id: string; username: string; iconUrl: string | null };
  score: number;
  comment: string | null;
  createdAt: string;
};

// ─── モックゲームデータ ──────────────────────────────────────────────────────

export const MOCK_GAMES: Game[] = [
  { id: "game-1", name: "VALORANT", coverImageUrl: "/images/covers/valorant.jpg" },
  { id: "game-2", name: "Apex Legends", coverImageUrl: "/images/covers/apex-legends.jpg" },
  { id: "game-3", name: "Splatoon 3", coverImageUrl: "/images/covers/splatoon-3.jpg" },
  { id: "game-4", name: "League of Legends", coverImageUrl: "/images/covers/league-of-legends.jpg" },
  { id: "game-5", name: "Minecraft", coverImageUrl: "/images/covers/minecraft.jpg" },
  { id: "game-6", name: "Genshin Impact", coverImageUrl: "/images/covers/genshin-impact.jpg" },
  { id: "game-7", name: "Overwatch 2", coverImageUrl: "/images/covers/overwatch-2.jpg" },
  { id: "game-8", name: "Fortnite", coverImageUrl: "/images/covers/fortnite.jpg" },
  { id: "game-9", name: "Final Fantasy XIV Online", coverImageUrl: "/images/covers/final-fantasy-xiv-online.jpg" },
  { id: "game-10", name: "Call of Duty: Modern Warfare III", coverImageUrl: "/images/covers/cod-mwiii.jpg" },
  { id: "game-11", name: "ELDEN RING", coverImageUrl: "/images/covers/elden-ring.jpg" },
  { id: "game-12", name: "Pokémon Unite", coverImageUrl: "/images/covers/pokemon-unite.jpg" },
];

// ─── プレイスタイルタグ ──────────────────────────────────────────────────────

export const PLAY_STYLE_TAGS: PlayStyleTag[] = [
  { id: "tag-1", name: "ガチ勢", slug: "hardcore", displayOrder: 1 },
  { id: "tag-2", name: "エンジョイ勢", slug: "casual", displayOrder: 2 },
  { id: "tag-3", name: "初心者歓迎", slug: "beginner_friendly", displayOrder: 3 },
  { id: "tag-4", name: "上級者向け", slug: "advanced", displayOrder: 4 },
  { id: "tag-5", name: "深夜勢", slug: "late_night", displayOrder: 5 },
  { id: "tag-6", name: "配信者", slug: "streamer", displayOrder: 6 },
];

// ─── ユーザー ────────────────────────────────────────────────────────────────

export const CURRENT_USER: User = {
  id: "user-me",
  username: "ShadowBlade99",
  iconUrl: null,
  bio: "毎日深夜にVALORANTやってます。ガチ勢ですが初心者も歓迎！ボイスチャット必須です。",
  avgRating: 4.2,
  ratingCount: 128,
  playStyleTags: [PLAY_STYLE_TAGS[0], PLAY_STYLE_TAGS[4]],
  games: [MOCK_GAMES[0], MOCK_GAMES[1]],
};

export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    username: "NightHunter",
    iconUrl: null,
    bio: "週末ゲーマー。楽しく遊べる人大歓迎！",
    avgRating: 4.7,
    ratingCount: 89,
    playStyleTags: [PLAY_STYLE_TAGS[1]],
    games: [MOCK_GAMES[1], MOCK_GAMES[2]],
  },
  {
    id: "user-2",
    username: "PixelWarrior",
    iconUrl: null,
    bio: "競技シーン志向。ランク上げたい人と組みたい",
    avgRating: 3.8,
    ratingCount: 42,
    playStyleTags: [PLAY_STYLE_TAGS[0], PLAY_STYLE_TAGS[3]],
    games: [MOCK_GAMES[3], MOCK_GAMES[0]],
  },
  {
    id: "user-3",
    username: "StarDrifter",
    iconUrl: null,
    bio: null,
    avgRating: null,
    ratingCount: 3,
    playStyleTags: [PLAY_STYLE_TAGS[2]],
    games: [MOCK_GAMES[5]],
  },
];

// ─── 部屋 ────────────────────────────────────────────────────────────────────

export const MOCK_ROOMS: Room[] = [
  {
    id: "room-1",
    title: "深夜VALORANT スモーク使える方歓迎",
    game: MOCK_GAMES[0],
    description: "イモータル帯でランク上げたい人向け。VC必須。",
    maxPlayers: 5,
    currentPlayers: 3,
    status: "waiting",
    playStyleTags: [PLAY_STYLE_TAGS[0], PLAY_STYLE_TAGS[4]],
    host: { id: "user-me", username: "ShadowBlade99", iconUrl: null, avgRating: 4.2 },
    participants: [
      { userId: "user-me", username: "ShadowBlade99", iconUrl: null, avgRating: 4.2, isHost: true, joinedAt: "2026-02-22T22:00:00Z" },
      { userId: "user-1", username: "NightHunter", iconUrl: null, avgRating: 4.7, isHost: false, joinedAt: "2026-02-22T22:05:00Z" },
      { userId: "user-2", username: "PixelWarrior", iconUrl: null, avgRating: 3.8, isHost: false, joinedAt: "2026-02-22T22:10:00Z" },
    ],
    createdAt: "2026-02-22T22:00:00Z",
    closedAt: null,
  },
  {
    id: "room-2",
    title: "Apex 初心者でも大丈夫！気軽にどうぞ",
    game: MOCK_GAMES[1],
    description: "カジュアルに楽しみたい方向け。勝敗より楽しさ優先！",
    maxPlayers: 3,
    currentPlayers: 1,
    status: "waiting",
    playStyleTags: [PLAY_STYLE_TAGS[1], PLAY_STYLE_TAGS[2]],
    host: { id: "user-1", username: "NightHunter", iconUrl: null, avgRating: 4.7 },
    participants: [
      { userId: "user-1", username: "NightHunter", iconUrl: null, avgRating: 4.7, isHost: true, joinedAt: "2026-02-22T21:00:00Z" },
    ],
    createdAt: "2026-02-22T21:00:00Z",
    closedAt: null,
  },
  {
    id: "room-3",
    title: "スプラ3 ウデマエX民集まれ",
    game: MOCK_GAMES[2],
    description: "ガチマッチ専門。X帯以上のみ。",
    maxPlayers: 4,
    currentPlayers: 4,
    status: "full",
    playStyleTags: [PLAY_STYLE_TAGS[0], PLAY_STYLE_TAGS[3]],
    host: { id: "user-2", username: "PixelWarrior", iconUrl: null, avgRating: 3.8 },
    participants: [
      { userId: "user-2", username: "PixelWarrior", iconUrl: null, avgRating: 3.8, isHost: true, joinedAt: "2026-02-22T20:00:00Z" },
      { userId: "user-3", username: "StarDrifter", iconUrl: null, avgRating: null, isHost: false, joinedAt: "2026-02-22T20:05:00Z" },
      { userId: "user-4", username: "CosmicAce", iconUrl: null, avgRating: 4.5, isHost: false, joinedAt: "2026-02-22T20:10:00Z" },
      { userId: "user-5", username: "VoidWalker", iconUrl: null, avgRating: 4.1, isHost: false, joinedAt: "2026-02-22T20:15:00Z" },
    ],
    createdAt: "2026-02-22T20:00:00Z",
    closedAt: null,
  },
  {
    id: "room-4",
    title: "LoL ランク戦 シルバー帯",
    game: MOCK_GAMES[3],
    description: "シルバー〜ゴールド帯の方歓迎。ADC・サポート募集中",
    maxPlayers: 5,
    currentPlayers: 3,
    status: "waiting",
    playStyleTags: [PLAY_STYLE_TAGS[0]],
    host: { id: "user-3", username: "StarDrifter", iconUrl: null, avgRating: null },
    participants: [
      { userId: "user-3", username: "StarDrifter", iconUrl: null, avgRating: null, isHost: true, joinedAt: "2026-02-22T21:30:00Z" },
      { userId: "user-4", username: "CosmicAce", iconUrl: null, avgRating: 4.5, isHost: false, joinedAt: "2026-02-22T21:35:00Z" },
      { userId: "user-5", username: "VoidWalker", iconUrl: null, avgRating: 4.1, isHost: false, joinedAt: "2026-02-22T21:40:00Z" },
    ],
    createdAt: "2026-02-22T21:30:00Z",
    closedAt: null,
  },
  {
    id: "room-5",
    title: "原神 深境螺旋36星クリア目指す",
    game: MOCK_GAMES[5],
    description: "36星クリアしたい方と。役割分担しっかりやりたい",
    maxPlayers: 4,
    currentPlayers: 2,
    status: "waiting",
    playStyleTags: [PLAY_STYLE_TAGS[1], PLAY_STYLE_TAGS[4]],
    host: { id: "user-4", username: "CosmicAce", iconUrl: null, avgRating: 4.5 },
    participants: [
      { userId: "user-4", username: "CosmicAce", iconUrl: null, avgRating: 4.5, isHost: true, joinedAt: "2026-02-22T23:00:00Z" },
      { userId: "user-5", username: "VoidWalker", iconUrl: null, avgRating: 4.1, isHost: false, joinedAt: "2026-02-22T23:10:00Z" },
    ],
    createdAt: "2026-02-22T23:00:00Z",
    closedAt: null,
  },
  {
    id: "room-6",
    title: "マイクラ 建築サーバー 配信者コラボ",
    game: MOCK_GAMES[4],
    description: "建築得意な配信者さん大歓迎！一緒に大型建築しましょう",
    maxPlayers: 8,
    currentPlayers: 2,
    status: "waiting",
    playStyleTags: [PLAY_STYLE_TAGS[1], PLAY_STYLE_TAGS[5]],
    host: { id: "user-5", username: "VoidWalker", iconUrl: null, avgRating: 4.1 },
    participants: [
      { userId: "user-5", username: "VoidWalker", iconUrl: null, avgRating: 4.1, isHost: true, joinedAt: "2026-02-22T22:30:00Z" },
      { userId: "user-1", username: "NightHunter", iconUrl: null, avgRating: 4.7, isHost: false, joinedAt: "2026-02-22T22:35:00Z" },
    ],
    createdAt: "2026-02-22T22:30:00Z",
    closedAt: null,
  },
];

// ─── チャット ────────────────────────────────────────────────────────────────

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    roomId: "room-1",
    user: null,
    content: "ShadowBlade99 が部屋を作成しました。",
    isSystem: true,
    createdAt: "2026-02-22T22:00:00Z",
  },
  {
    id: "msg-2",
    roomId: "room-1",
    user: { id: "user-me", username: "ShadowBlade99", iconUrl: null },
    content: "よろしくお願いします！今日はイモータル帯狙いで行きます",
    isSystem: false,
    createdAt: "2026-02-22T22:01:00Z",
  },
  {
    id: "msg-3",
    roomId: "room-1",
    user: null,
    content: "NightHunter が入室しました。",
    isSystem: true,
    createdAt: "2026-02-22T22:05:00Z",
  },
  {
    id: "msg-4",
    roomId: "room-1",
    user: { id: "user-1", username: "NightHunter", iconUrl: null },
    content: "よろしく！スモーク使えます。どのロール希望ですか？",
    isSystem: false,
    createdAt: "2026-02-22T22:06:00Z",
  },
  {
    id: "msg-5",
    roomId: "room-1",
    user: { id: "user-me", username: "ShadowBlade99", iconUrl: null },
    content: "ジェットかレイナ使います！フラッシュ担当お願いできますか",
    isSystem: false,
    createdAt: "2026-02-22T22:07:00Z",
  },
  {
    id: "msg-6",
    roomId: "room-1",
    user: null,
    content: "PixelWarrior が入室しました。",
    isSystem: true,
    createdAt: "2026-02-22T22:10:00Z",
  },
  {
    id: "msg-7",
    roomId: "room-1",
    user: { id: "user-2", username: "PixelWarrior", iconUrl: null },
    content: "よろよろ！コントローラーできます",
    isSystem: false,
    createdAt: "2026-02-22T22:10:30Z",
  },
  {
    id: "msg-8",
    roomId: "room-1",
    user: { id: "user-1", username: "NightHunter", iconUrl: null },
    content: "了解です！頑張りましょう 💪",
    isSystem: false,
    createdAt: "2026-02-22T22:11:00Z",
  },
  {
    id: "msg-9",
    roomId: "room-1",
    user: { id: "user-me", username: "ShadowBlade99", iconUrl: null },
    content: "あと2人で始められますね。もう少し待ちましょうか",
    isSystem: false,
    createdAt: "2026-02-22T22:12:00Z",
  },
  {
    id: "msg-10",
    roomId: "room-1",
    user: { id: "user-2", username: "PixelWarrior", iconUrl: null },
    content: "マップ希望とかありますか？アイスボックス得意です",
    isSystem: false,
    createdAt: "2026-02-22T22:13:00Z",
  },
];

// ─── 評価 ────────────────────────────────────────────────────────────────────

export const MOCK_RATINGS: Rating[] = [
  {
    id: "rating-1",
    roomId: "room-old-1",
    reviewer: { id: "user-1", username: "NightHunter", iconUrl: null },
    score: 5,
    comment: "また一緒にやりましょう！コミュニケーション取りやすかったです",
    createdAt: "2026-02-20T23:00:00Z",
  },
  {
    id: "rating-2",
    roomId: "room-old-2",
    reviewer: { id: "user-2", username: "PixelWarrior", iconUrl: null },
    score: 4,
    comment: null,
    createdAt: "2026-02-18T20:00:00Z",
  },
  {
    id: "rating-3",
    roomId: "room-old-3",
    reviewer: { id: "user-3", username: "StarDrifter", iconUrl: null },
    score: 4,
    comment: "上手かった！",
    createdAt: "2026-02-15T19:30:00Z",
  },
];

// ─── 参加履歴 ────────────────────────────────────────────────────────────────

export const MOCK_HISTORY_ROOMS = [
  { id: "room-old-1", title: "深夜Apex部屋", game: MOCK_GAMES[1], joinedAt: "2026-02-20T22:00:00Z", closedAt: "2026-02-20T23:30:00Z" },
  { id: "room-old-2", title: "LoL ランク上げ隊", game: MOCK_GAMES[3], joinedAt: "2026-02-18T19:00:00Z", closedAt: "2026-02-18T21:00:00Z" },
  { id: "room-old-3", title: "スプラ エリア専門", game: MOCK_GAMES[2], joinedAt: "2026-02-15T20:00:00Z", closedAt: "2026-02-15T22:00:00Z" },
  { id: "room-old-4", title: "VALORANT 初心者部屋", game: MOCK_GAMES[0], joinedAt: "2026-02-10T21:00:00Z", closedAt: "2026-02-10T23:00:00Z" },
  { id: "room-old-5", title: "原神 週ボス周回", game: MOCK_GAMES[5], joinedAt: "2026-02-05T18:00:00Z", closedAt: "2026-02-05T19:30:00Z" },
];

// ─── 評価待ちユーザー ──────────────────────────────────────────────────────

export const PENDING_RATING_USERS = [
  { userId: "user-1", username: "NightHunter", iconUrl: null, avgRating: 4.7, expiresAt: "2026-02-23T22:00:00Z" },
  { userId: "user-2", username: "PixelWarrior", iconUrl: null, avgRating: 3.8, expiresAt: "2026-02-23T22:00:00Z" },
];

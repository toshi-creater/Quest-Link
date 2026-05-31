import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchGames, getPopularGames, getPopularGamesExcluding, getGameById } from "@/lib/games";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindMany = vi.mocked(prisma.game.findMany);
const mockFindUnique = vi.mocked(prisma.game.findUnique);

const sampleGames = [
  { id: "1", name: "Apex Legends", coverImageUrl: "https://example.com/apex.jpg" },
  { id: "2", name: "Valorant", coverImageUrl: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchGames", () => {
  it("正常系: Prisma呼び出し引数と戻り値形状を検証する", async () => {
    mockFindMany.mockResolvedValueOnce(sampleGames);

    const result = await searchGames("apex", 5);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { name: { contains: "apex", mode: "insensitive" }, isActive: true },
      orderBy: { displayOrder: "asc" },
      take: 5,
      select: { id: true, name: true, coverImageUrl: true },
    });
    expect(result).toEqual(sampleGames);
  });

  it("空クエリで contains: '' が渡る", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await searchGames("");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: "" }),
        }),
      })
    );
  });

  it("where に isActive: true が含まれる", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await searchGames("test");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });
});

describe("getPopularGames", () => {
  it("デフォルト引数で take: 10 が渡る", async () => {
    mockFindMany.mockResolvedValueOnce(sampleGames);

    await getPopularGames();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("カスタム limit が take に反映される", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getPopularGames(3);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it("where に isActive: true が含まれる", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getPopularGames();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });
});

describe("getPopularGamesExcluding", () => {
  it("excludeIds が空のとき notIn フィルターなしで呼ばれる", async () => {
    mockFindMany.mockResolvedValueOnce(sampleGames);

    const result = await getPopularGamesExcluding([], 6);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      take: 6,
      select: { id: true, name: true, coverImageUrl: true },
    });
    expect(result).toEqual(sampleGames);
  });

  it("excludeIds に値があるとき id: { notIn } フィルターが付く", async () => {
    mockFindMany.mockResolvedValueOnce([sampleGames[1]]);

    const result = await getPopularGamesExcluding(["1"], 5);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { isActive: true, id: { notIn: ["1"] } },
      orderBy: { displayOrder: "asc" },
      take: 5,
      select: { id: true, name: true, coverImageUrl: true },
    });
    expect(result).toEqual([sampleGames[1]]);
  });

  it("limit が take に反映される", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getPopularGamesExcluding(["1", "2"], 3);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it("結果が空配列のとき空配列を返す", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const result = await getPopularGamesExcluding(["1", "2"], 6);

    expect(result).toEqual([]);
  });
});

describe("getGameById", () => {
  it("存在するIDで findUnique({ where: { id } }) が呼ばれる", async () => {
    const game = sampleGames[0];
    mockFindUnique.mockResolvedValueOnce(game);

    const result = await getGameById("1");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: { id: true, name: true, coverImageUrl: true },
    });
    expect(result).toEqual(game);
  });

  it("存在しないIDで null を返す", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getGameById("nonexistent");

    expect(result).toBeNull();
  });
});

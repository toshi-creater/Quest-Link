import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tags = [
    { name: "ガチ勢", slug: "hardcore", displayOrder: 1 },
    { name: "エンジョイ勢", slug: "casual", displayOrder: 2 },
    { name: "初心者歓迎", slug: "beginner_friendly", displayOrder: 3 },
    { name: "上級者向け", slug: "advanced", displayOrder: 4 },
    { name: "深夜勢", slug: "late_night", displayOrder: 5 },
    { name: "配信者", slug: "streamer", displayOrder: 6 },
  ];

  for (const tag of tags) {
    await prisma.playStyleTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log(`Seeded ${tags.length} play_style_tags`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Running Prisma DB test...");

  const roles = await prisma.role.findMany();
  console.log("🔑 Roles:", roles);

  const admin = await prisma.user.findFirst({
    where: { email: "admin@bazarit.com" },
    include: { role: true },
  });
  console.log("👤 Admin:", admin);

  const shops = await prisma.shop.findMany({
    include: {
      location: true,
      license: true,
      products: {
        include: {
          images: true,
          category: true,
          ratings: true,
        },
      },
    },
  });
  console.log("🏪 Shops:", JSON.stringify(shops, null, 2));

  const categories = await prisma.category.findMany();
  console.log("📦 Categories:", categories);

  const ratings = await prisma.rating.findMany({
    include: { product: true, user: true },
  });
  console.log("⭐ Ratings:", ratings);
}

main()
  .catch((e) => {
    console.error("❌ DB Test Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

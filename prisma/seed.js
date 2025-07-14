import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Bazarit MVP database...");

  // 1. Define Roles & Permissions
  const roleTemplates = {
    admin: {
      description: "Platform administrator",
      permissions: [
        "manage_users",
        "manage_shops",
        "add_product",
        "view_analytics",
      ],
    },
    shop_owner: {
      description: "Shop manager account",
      permissions: ["add_product", "view_analytics"],
    },
    buyer: {
      description: "Customer buyer account",
      permissions: [],
    },
  };

  const permissionList = [
    { name: "manage_users", description: "Admin can manage all users" },
    { name: "manage_shops", description: "Admin can manage shops" },
    { name: "add_product", description: "Shop owner can add products" },
    { name: "view_analytics", description: "Shop owner can view insights" },
  ];

  // 2. Seed Permissions
  await prisma.permission.createMany({
    data: permissionList,
    skipDuplicates: true,
  });

  const allPermissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    allPermissions.map((p) => [p.name, p.id])
  );

  // 3. Seed Roles
  const roles = {};
  for (const [roleName, roleData] of Object.entries(roleTemplates)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: roleData.description,
      },
    });
    roles[roleName] = role;

    // 4. Link Permissions to Role
    const rolePerms = roleData.permissions.map((permName) => ({
      roleId: role.id,
      permissionId: permissionMap[permName],
    }));

    if (rolePerms.length) {
      await prisma.rolePermission.createMany({
        data: rolePerms,
        skipDuplicates: true,
      });
    }
  }

  // 5. Create Admin User
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@bazarit.com" },
    update: {},
    create: {
      name: "Wubishet Admin",
      email: "admin@bazarit.com",
      password: hashedPassword,
      roleId: roles.admin.id,
    },
  });

  // 6. Find or Create Location (city + region not unique)
  let addis = await prisma.location.findFirst({
    where: { city: "Addis Ababa", region: "Addis Ababa" },
  });
  if (!addis) {
    addis = await prisma.location.create({
      data: {
        city: "Addis Ababa",
        region: "Addis Ababa",
        latitude: 9.03,
        longitude: 38.74,
      },
    });
  }

  // 7. Create Category
  const electronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });

  // 8. Create Shop
  const shop = await prisma.shop.create({
    data: {
      userId: adminUser.id,
      name: "Wube Electronics",
      description: "Quality electronics and gadgets.",
      phone: "+251911000000",
      whatsappNumber: "+251911000000",
      address: "Bole, Addis Ababa",
      locationId: addis.id,
      googleMapsUrl: "https://maps.app.goo.gl/example",
      bannerUrl: "https://bazarit.com/images/banner.jpg",
    },
  });

  // 9. License
  await prisma.license.create({
    data: {
      shopId: shop.id,
      licenseNumber: "LIC-2025-0001",
      issuedDate: new Date("2025-01-01"),
      expiryDate: new Date("2026-01-01"),
      status: "active",
    },
  });

  // 10. Product
  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      categoryId: electronics.id,
      title: "Samsung Galaxy S24",
      description: "Flagship phone with 5G and AI features.",
      price: 39999.99,
    },
  });

  // 11. Product Image
  await prisma.productImage.create({
    data: {
      productId: product.id,
      imageUrl: "https://bazarit.com/products/samsung-s24.jpg",
      isPrimary: true,
      position: 1,
    },
  });

  // 12. Initial Rating
  await prisma.rating.create({
    data: {
      value: 5,
      review: "Top product!",
      userId: adminUser.id,
      productId: product.id,
    },
  });

  console.log("✅ Bazarit MVP seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

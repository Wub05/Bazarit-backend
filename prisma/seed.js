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

  // 2. Prepare permission data WITHOUT manually setting UUIDs
  const permissionList = [
    { name: "manage_users", description: "Can manage users" },
    { name: "manage_shops", description: "Can manage shops" },
    { name: "add_product", description: "Can add products" },
    { name: "view_analytics", description: "Can view analytics" },
    { name: "CREATE_SHOP", description: "Can create a new shop" },
    { name: "EDIT_SHOP", description: "Can edit existing shop" },
    { name: "DELETE_SHOP", description: "Can delete a shop" },
    { name: "VIEW_USERS", description: "Can view users" },
    { name: "MANAGE_PRODUCTS", description: "Can add/edit/delete products" },
    {
      name: "MANAGE_RATINGS",
      description: "Can view or remove inappropriate ratings",
    },
  ];

  // 2. Seed Permissions
  for (const permission of permissionList) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // 3. Fetch all permissions (to get their IDs)
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    allPermissions.map((p) => [p.name, p.id])
  );

  // 4. Create ADMIN role (if not exists)
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "System administrator",
    },
  });

  // 5. Assign all permissions to ADMIN role
  await prisma.rolePermission.createMany({
    data: Object.values(permissionMap).map((permissionId) => ({
      roleId: adminRole.id,
      permissionId,
    })),
    skipDuplicates: true, // prevent duplicate entries
  });
  // 5. Seed Roles + Permissions
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

  // 6. Create Admin User
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

  // 7. Ensure Location
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

  // 8. Ensure Category
  const electronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });

  // 9. Create Shop
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

  // 10. License
  await prisma.license.create({
    data: {
      shopId: shop.id,
      licenseNumber: "LIC-2025-0001",
      issuedDate: new Date("2025-01-01"),
      expiryDate: new Date("2026-01-01"),
      status: "active",
    },
  });

  // 11. Product
  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      categoryId: electronics.id,
      title: "Samsung Galaxy S24",
      description: "Flagship phone with 5G and AI features.",
      price: 39999.99,
    },
  });

  // 12. Product Image
  await prisma.productImage.create({
    data: {
      productId: product.id,
      imageUrl: "https://bazarit.com/products/samsung-s24.jpg",
      isPrimary: true,
      position: 1,
    },
  });

  // 13. Product Rating
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

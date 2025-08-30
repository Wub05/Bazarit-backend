import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { z } from "zod";

/** Create Shop */
export const createShop = async (req, res) => {
  try {
    const userId = req.user.id; // assuming token gives user ID
    const {
      name,
      description,
      phone,
      whatsappNumber,
      address,
      locationId,
      googleMapsUrl,
      bannerUrl,
    } = req.body;

    const shop = await prisma.shop.create({
      data: {
        name,
        description,
        phone,
        whatsappNumber,
        address,
        locationId,
        googleMapsUrl,
        bannerUrl,
        userId,
      },
    });

    res.status(201).json(shop);
  } catch (error) {
    console.error("Create shop error:", error);
    res.status(500).json({ error: "Failed to create shop" });
  }
};

/** Get All Shops (Optionally Filter by location or name) */
export const getAllShops = async (req, res) => {
  try {
    const { locationId, name } = req.query;

    const shops = await prisma.shop.findMany({
      where: {
        ...(locationId && { locationId }),
        ...(name && { name: { contains: name, mode: "insensitive" } }),
      },
      include: { location: true, owner: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(shops);
  } catch (error) {
    console.error("Get shops error:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
};

/** Get Single Shop */
export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: { location: true, owner: true, products: true, ratings: true },
    });

    if (!shop) return res.status(404).json({ error: "Shop not found" });

    res.json(shop);
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
};

/** Update Shop */
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const shop = await prisma.shop.update({
      where: { id },
      data: { ...req.body },
    });

    res.json(shop);
  } catch (error) {
    console.error("Update shop error:", error);
    res.status(500).json({ error: "Failed to update shop" });
  }
};

/** Delete Shop */
export const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.shop.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await prisma.shop.delete({ where: { id } });

    res.json({ message: "Shop deleted" });
  } catch (error) {
    console.error("Delete shop error:", error);
    res.status(500).json({ error: "Failed to delete shop" });
  }
};

// Validation for query params
const listProductsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
});

//list only products of a specific Shop
export const listShopProducts = async (req, res) => {
  try {
    const { shopId } = req.params;
    const query = listProductsQuery.parse(req.query);

    // Check if shop exists and is active
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, isSuspended: true },
    });
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    if (shop.isSuspended)
      return res.status(403).json({ error: "Shop is suspended" });

    const where = {
      shopId,
      ...(query.search
        ? { name: { contains: query.search, mode: "insensitive" } }
        : {}),
      ...(query.category ? { category: { name: query.category } } : {}), // assumes relation with category
      isActive: true, // only active products
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      shopId,
      shopName: shop.name,
      page: query.page,
      limit: query.limit,
      total,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//***************************************** */
//*          future work                    *
//****************************************** */

// import { sendNotification } from "../utils/notification.js"; // first create it

// ✅ Suspend a Shop
export const suspendShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id; // from auth middleware

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    if (shop.isSuspended) {
      return res.status(400).json({ message: "Shop is already suspended." });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        isSuspended: true,
        suspensionReason: reason || "Policy violation",
        suspendedAt: new Date(),
      },
    });

    // ✅ Audit log
    await prisma.shopAudit.create({
      data: {
        shopId,
        action: "SUSPEND",
        reason: reason || "Policy violation",
        performedBy: adminId,
      },
    });

    // ✅ Notify shop owner

    /*  await sendNotification({
      userId: shop.userId,
      title: "Your shop has been suspended",
      message: `Reason: ${
        reason || "Policy violation"
      }. Please update your products or contact support.`,
    });
*/
    res.json({ message: "Shop suspended successfully.", shop: updatedShop });
  } catch (error) {
    console.error("Suspend shop error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ✅ Activate a Shop
export const activateShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const adminId = req.user.id;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    if (!shop.isSuspended) {
      return res.status(400).json({ message: "Shop is already active." });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        isSuspended: false,
        suspensionReason: null,
        activatedAt: new Date(),
      },
    });

    // ✅ Audit log
    await prisma.shopAudit.create({
      data: {
        shopId,
        action: "ACTIVATE",
        reason: "Admin reactivation",
        performedBy: adminId,
      },
    });

    // ✅ Notify shop owner

    /*
    await sendNotification({
      userId: shop.userId,
      title: "Your shop has been reactivated",
      message:
        "Your shop is now live again. Please continue to follow marketplace policies.",
    });
*/
    res.json({ message: "Shop activated successfully.", shop: updatedShop });
  } catch (error) {
    console.error("Activate shop error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

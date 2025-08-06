import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

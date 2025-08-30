import prisma from "../prisma/client.js";

/**
 * 🏬 DISCOVER SHOPS
 * Supports filters: categoryId, locationId, minRating, pagination
 */
export const discoverShops = async (req, res) => {
  try {
    const {
      categoryId,
      locationId,
      minRating,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (page - 1) * limit;

    const shops = await prisma.shop.findMany({
      where: {
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(locationId && { locationId: parseInt(locationId) }),
        ...(minRating && {
          ratings: {
            some: { value: { gte: parseFloat(minRating) } },
          },
        }),
        isActive: true, // Only show active shops
      },
      include: {
        category: true,
        location: true,
        ratings: { select: { value: true } },
        products: {
          take: 3, // Show only a preview of products
          select: { id: true, name: true, price: true, images: true },
        },
      },
      skip,
      take: parseInt(limit),
    });

    res.json({ data: shops, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("Error discovering shops:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 🏬 DISCOVER SINGLE SHOP DETAILS
 */
export const discoverShopById = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(req.params.shopId) },
      include: {
        category: true,
        location: true,
        ratings: true,
        products: {
          take: 10,
          select: { id: true, name: true, price: true, images: true },
        },
      },
    });

    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (err) {
    console.error("Error fetching shop:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 📦 DISCOVER PRODUCTS
 * Supports filters: categoryId, shopId, price range, pagination
 */
export const discoverProducts = async (req, res) => {
  try {
    const {
      categoryId,
      shopId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(shopId && { shopId: parseInt(shopId) }),
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      },
      include: {
        shop: { select: { id: true, name: true, location: true } },
        images: true,
        ratings: { select: { value: true } },
      },
      skip,
      take: parseInt(limit),
    });

    res.json({ data: products, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("Error discovering products:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 📦 DISCOVER SINGLE PRODUCT DETAILS
 */
export const discoverProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.productId) },
      include: {
        shop: { select: { id: true, name: true, location: true } },
        images: true,
        ratings: true,
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 🔍 SEARCH SHOPS
 */
export const searchShops = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query required" });

    const shops = await prisma.shop.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
        isActive: true,
      },
      include: { category: true, location: true },
    });

    res.json(shops);
  } catch (err) {
    console.error("Error searching shops:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 🔍 SEARCH PRODUCTS
 */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query required" });

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { shop: true, images: true },
    });

    res.json(products);
  } catch (err) {
    console.error("Error searching products:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

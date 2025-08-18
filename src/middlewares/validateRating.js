import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const validateRating = async (req, res, next) => {
  const userId = req.user?.id;
  const { productId, shopId, value } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (!productId && !shopId) {
    return res.status(400).json({ error: "Must rate a product or a shop" });
  }

  try {
    const existingRating = await prisma.rating.findFirst({
      where: {
        userId,
        ...(productId ? { productId } : { shopId }),
      },
    });

    if (existingRating) {
      return res.status(409).json({ error: "You already rated this item" });
    }

    // Check target exists
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) return res.status(404).json({ error: "Product not found" });
    }

    if (shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) return res.status(404).json({ error: "Shop not found" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//create Rating
export const createRating = async (req, res) => {
  const userId = req.user.id;
  const { productId, shopId, value, review } = req.body;

  try {
    const rating = await prisma.rating.create({
      data: {
        userId,
        value,
        review,
        productId: productId || null,
        shopId: shopId || null,
      },
    });

    res.status(201).json({ message: "Rating submitted", rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create rating" });
  }
};

//Get shop/product ratings

// GET /api/ratings/product/:productId
export const getProductRatings = async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { productId: req.params.productId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ratings." });
  }
};

// GET /api/ratings/shop/:shopId
export const getShopRatings = async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { shopId: req.params.shopId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ratings." });
  }
};
//update ratings
// PATCH /api/ratings/:id
export const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, review } = req.body;

    const rating = await prisma.rating.findUnique({ where: { id } });

    if (!rating) return res.status(404).json({ message: "Rating not found." });
    if (rating.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const updated = await prisma.rating.update({
      where: { id },
      data: { value, review },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update rating." });
  }
};

//Delete rating
// DELETE /api/ratings/:id
export const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = await prisma.rating.findUnique({ where: { id } });

    if (!rating) return res.status(404).json({ message: "Rating not found." });
    if (rating.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await prisma.rating.delete({ where: { id } });
    res.json({ message: "Rating deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete rating." });
  }
};

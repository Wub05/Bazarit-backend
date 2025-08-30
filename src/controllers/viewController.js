import prisma from "../prisma/client.js";

/**
 * Record a view for a shop or product
 * entityType: "shop" or "product"
 * shopId/productId: ID of the entity
 * ipAddress: captured from request
 */
export const recordView = async (req, res) => {
  try {
    const { entityType, shopId, productId } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Validate input
    if (!["shop", "product"].includes(entityType)) {
      return res.status(400).json({ message: "Invalid entityType" });
    }
    if (entityType === "shop" && !shopId) {
      return res
        .status(400)
        .json({ message: "shopId is required for shop views" });
    }
    if (entityType === "product" && !productId) {
      return res
        .status(400)
        .json({ message: "productId is required for product views" });
    }

    const view = await prisma.view.create({
      data: {
        entityType,
        shopId: entityType === "shop" ? shopId : null,
        productId: entityType === "product" ? productId : null,
        ipAddress,
      },
    });

    res.status(201).json({ message: "View recorded", viewId: view.id });
  } catch (err) {
    console.error("Error recording view:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get aggregated views for a shop
 * Returns total views
 */
export const getShopViews = async (req, res) => {
  try {
    const { shopId } = req.params;

    const totalViews = await prisma.view.count({
      where: { entityType: "shop", shopId },
    });

    res.json({ shopId, totalViews });
  } catch (err) {
    console.error("Error fetching shop views:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get aggregated views for a product
 * Returns total views
 */
export const getProductViews = async (req, res) => {
  try {
    const { productId } = req.params;

    const totalViews = await prisma.view.count({
      where: { entityType: "product", productId },
    });

    res.json({ productId, totalViews });
  } catch (err) {
    console.error("Error fetching product views:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

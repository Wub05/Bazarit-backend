import express from "express";
import {
  discoverShops,
  discoverShopById,
  discoverProducts,
  discoverProductById,
  searchShops,
  searchProducts,
} from "../controllers/discoveryContoller";

const router = express.Router();

/**
 * ----------------------
 * 🏬 SHOP DISCOVERY ROUTES
 * ----------------------
 */

// Get all shops with filters (category, location, rating, pagination)
router.get("/shops", discoverShops);

// Get single shop details with top products & ratings
router.get("/shops/:shopId", discoverShopById);

// Search shops by name or keywords
router.get("/shops/search", searchShops);

/**
 * ----------------------
 * 📦 PRODUCT DISCOVERY ROUTES
 * ----------------------
 */

// Get all products with filters (category, price, shop, pagination)
router.get("/products", discoverProducts);

// Get single product details with shop info
router.get("/products/:productId", discoverProductById);

// Search products by keywords
router.get("/products/search", searchProducts);

export default router;

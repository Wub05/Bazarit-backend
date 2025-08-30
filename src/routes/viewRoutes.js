import express from "express";
import {
  recordView,
  getShopViews,
  getProductViews,
} from "../controllers/viewController.js";

const router = express.Router();

// Record a view for shop or product

router.post("/views", recordView);

// Get total views for a shop

router.get("/shops/:shopId/views", getShopViews);

//Get total views for a product

router.get("/products/:productId/views", getProductViews);

export default router;

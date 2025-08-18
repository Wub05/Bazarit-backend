import express from "express";
import {
  createRating,
  getProductRatings,
  getShopRatings,
  updateRating,
  deleteRating,
} from "../controllers/ratingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateRating } from "../middlewares/validateRating.js";

const router = express.Router();

router.post("/", verifyToken, validateRating, createRating);
router.get("/product/:productId", getProductRatings);
router.get("/shop/:shopId", getShopRatings);
router.patch("/:id", verifyToken, updateRating);
router.delete("/:id", verifyToken, deleteRating);

export default router;

import express from "express";
import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
} from "../controllers/shopController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createShop);
router.get("/", getAllShops);
router.get("/:id", getShopById);
router.put("/:id", verifyToken, updateShop);
router.delete("/:id", verifyToken, deleteShop);

export default router;

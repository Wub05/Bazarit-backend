import express from "express";
import {
  createShopRequest,
  getMyShopRequests,
  getAllShopRequests,
  approveShopRequest,
  rejectShopRequest,
} from "../controllers/shopRequestController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// User routes
router.post("/", verifyToken, createShopRequest);
router.get("/me", verifyToken, getMyShopRequests);

// Admin routes
router.get("/", verifyToken, authorize("admin"), getAllShopRequests);
router.patch(
  "/:id/approve",
  verifyToken,
  authorize("admin"),
  approveShopRequest
);
router.patch("/:id/reject", verifyToken, authorize("admin"), rejectShopRequest);

export default router;

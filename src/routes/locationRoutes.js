import express from "express";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  getLocation,
  listLocations,
  nearbyLocations,
  getShopLocation,
  reassignShopLocation,
} from "../controllers/locationController";
import { requireAdmin } from "../middlewares/requireAdmin";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes
router.get("/locations", listLocations);
router.get("/locations/:locationId", getLocation);
router.get("/locations/nearby", nearbyLocations);
router.get("/shops/:shopId/location", getShopLocation);

// Admin-only routes (auth middleware can be added later)
router.post("/locations", verifyToken, requireAdmin, createLocation);
router.patch(
  "/locations/:locationId",
  verifyToken,
  requireAdmin,
  updateLocation
);
router.delete(
  "/locations/:locationId",
  verifyToken,
  requireAdmin,
  deleteLocation
);
router.patch(
  "/shops/:shopId/location",
  verifyToken,
  requireAdmin,
  reassignShopLocation
);

export default router;

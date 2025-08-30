import express from "express";
import {
  createPermission,
  getPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permissionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, authorize(["Admin"]), createPermission);
router.get("/", verifyToken, getPermissions);
router.get("/:id", verifyToken, getPermissionById);
router.put("/:id", verifyToken, authorize(["Admin"]), updatePermission);
router.delete("/:id", verifyToken, authorize(["Admin"]), deletePermission);

export default router;

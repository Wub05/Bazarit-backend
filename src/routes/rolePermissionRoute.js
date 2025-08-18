import express from "express";
import {
  assignPermissionToRole,
  removePermissionFromRole,
  getPermissionsByRole,
} from "../controllers/rolePermissionController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorizePermission } from "../middlewares/authorizePermission.js";

const router = express.Router();

// ✅ Only admin can manage role–permission relationships
router.post(
  "/assign",
  verifyToken,
  authorizePermission("manage_role_permissions"),
  assignPermissionToRole
);

router.delete(
  "/remove",
  verifyToken,
  authorizePermission("manage_role_permissions"),
  removePermissionFromRole
);

router.get(
  "/role/:roleId",
  verifyToken,
  authorizePermission("view_role_permissions"),
  getPermissionsByRole
);

export default router;

import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/roleController";
const router = express.Router();
import { authorize } from "../middlewares/roleMiddleware";
import { verifyToken } from "../middlewares/authMiddleware";

/**
 * Only authenticated users with 'Admin' role can create, update, or delete roles.
 * All authenticated users can view roles, but public access is restricted for security.
 */

router.post("/", verifyToken, authorize("Admin"), createRole); //admin only
router.get("/", verifyToken, authorize("Admin", "Manager"), getRoles);
router.get("/:id", verifyToken, authorize("Admin", "Manager"), getRoleById);
router.put("/:id", verifyToken, authorize("Admin"), updateRole);
router.delete("/:id", verifyToken, authorize("Admin"), deleteRole);

export default router;

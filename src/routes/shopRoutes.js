import express from "express";
import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  listShopProducts,
} from "../controllers/shopController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllShops);
router.get("/:id", getShopById);
router.get("/shops/:shopId/products", listShopProducts);

router.post(
  "/",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["CREATE_SHOP"],
  }),
  createShop
);
router.put(
  "/:id",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["UPDATE_SHOP"],
  }),
  updateShop
);
router.delete(
  "/:id",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["DELETE_SHOP"],
  }),
  deleteShop
);

//***************************** */
//***** For Future work ****** */
//**************************** */

router.patch(
  "/shops/:shopId/suspend",
  verifyToken,
  authorize({
    requiredRoles: ["ADMIN"],
    requiredPermissions: ["SUSPEND_SHOP"],
  }),
  suspendShop
);

router.patch(
  "/shops/:shopId/activate",
  verifyToken,
  authorize({
    requiredRoles: ["ADMIN"],
    requiredPermissions: ["ACTIVATE_SHOP"],
  }),
  activateShop
);

export default router;

import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { verifyToken } from "../middlewares/authMiddleware";
import {
  deleteProductImage,
  uploadProductImage,
} from "../controllers/ImageUploadController";
import { upload } from "../middlewares/imageUploadMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post(
  "/shops/:shopId/products",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["CREATE_PRODUCT"],
  }),
  createProduct
);
router.put(
  "/products/:id",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["UPDATE_PRODUCT"],
  }),
  updateProduct
);
router.delete(
  "/products/:id",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["DELETE_PRODUCT"],
  }),
  deleteProduct
);

// Image management
router.post(
  "/products/upload-image",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["UPLOAD_PRODUCT_IMAGE"],
  }),
  upload.single("image"),
  uploadProductImage
);
router.delete(
  "/products/image/:imageId",
  verifyToken,
  authorize({
    requiredRoles: ["SHOP_OWNER"],
    requiredPermissions: ["DELETE_PRODUCT_IMAGE"],
  }),
  deleteProductImage
);

export default router;

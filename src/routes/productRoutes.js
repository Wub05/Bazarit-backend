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

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", verifyToken, createProduct);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

//Image route
router.post(
  "/upload-image",
  verifyToken,
  upload.single("image"),
  uploadProductImage
);
router.delete("/image/:imageId", verifyToken, deleteProductImage);

export default router;

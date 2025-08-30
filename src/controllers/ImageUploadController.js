import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Zergaw credentials
const ZERGAW_API_KEY = process.env.ZERGAW_API_KEY;
const ZERGAW_UPLOAD_URL = "https://api.zergaw.cloud/upload";
const ZERGAW_DELETE_URL = "https://api.zergaw.cloud/delete";

// Upload product image
export const uploadProductImage = async (req, res) => {
  try {
    const { productId, isPrimary = false, position = 0 } = req.body;
    const file = req.file; //file means image-file

    //   const { originalname, buffer, mimetype } = req.file;

    // 1. Validate file
    if (
      !file ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
    ) {
      return res.status(400).json({
        error: "Invalid image format. Only JPEG, PNG, or WebP allowed.",
      });
    }

    if (file.size > 3 * 1024 * 1024) {
      // 2MB
      return res
        .status(400)
        .json({ error: "Image too large. Max size is 3MB." });
    }

    // 2. Upload to Zergaw
    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.path));
    const response = await axios.post(ZERGAW_UPLOAD_URL, formData, {
      headers: {
        Authorization: `Bearer ${ZERGAW_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    const imageUrl = response.data.url; // Zergaw returns full image URL

    // 3. If isPrimary, reset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    // 4. Save image metadata to DB
    const savedImage = await prisma.productImage.create({
      data: {
        id: uuidv4(),
        productId,
        imageUrl,
        isPrimary,
        position: parseInt(position),
      },
    });

    // 5. Cleanup local tmp file
    fs.unlinkSync(file.path);

    res
      .status(201)
      .json({ message: "Image uploaded successfully.", image: savedImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image upload failed." });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    // 1. Find the image in DB
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) return res.status(404).json({ error: "Image not found." });

    // 2. Extract Zergaw file key from URL if needed
    const zergawKey = image.imageUrl.split("/").pop(); // Adjust based on actual format

    // 3. Delete from Zergaw
    await axios.post(
      ZERGAW_DELETE_URL,
      { key: zergawKey },
      {
        headers: { Authorization: `Bearer ${ZERGAW_API_KEY}` },
      }
    );

    // 4. Delete from DB
    await prisma.productImage.delete({ where: { id: imageId } });

    res.json({ message: "Image deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete image." });
  }
};

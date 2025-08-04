import { PrismaClient } from "@/lib/prisma";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Create Product
export const createProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { shopId, categoryId, title, description, price } = req.body;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser || !["seller", "admin"].includes(dbUser.role.name)) {
      return res
        .status(403)
        .json({ message: "Only sellers or admins can create products" });
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized to use this shop" });
    }

    const product = await prisma.product.create({
      data: {
        shopId,
        categoryId,
        title,
        description,
        price,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Products (with optional filters)
export const getAllProducts = async (req, res) => {
  try {
    const { shopId, categoryId } = req.query;

    const products = await prisma.product.findMany({
      where: {
        shopId: shopId ? Number(shopId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
      },
      include: {
        shop: true,
        category: true,
        productImages: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
        category: true,
        productImages: true,
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const productId = Number(req.params.id);
    const updateData = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isAdmin = dbUser?.role?.name === "admin";
    const isOwner = product.shop.userId === userId;

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this product" });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const productId = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isAdmin = dbUser?.role?.name === "admin";
    const isOwner = product.shop.userId === userId;

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this product" });
    }

    await prisma.product.delete({ where: { id: productId } });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

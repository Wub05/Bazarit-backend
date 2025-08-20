import prisma from "../prismaClient.js";

// User submits a shop request
export const createShopRequest = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Prevent duplicate pending requests for same user
    const existing = await prisma.shopRequest.findFirst({
      where: { userId: req.user.id, status: "pending" },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You already have a pending request." });
    }

    const request = await prisma.shopRequest.create({
      data: {
        userId: req.user.id,
        name,
        description,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating shop request" });
  }
};

// User views their requests
export const getMyShopRequests = async (req, res) => {
  try {
    const requests = await prisma.shopRequest.findMany({
      where: { userId: req.user.id },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

// Admin views all requests
export const getAllShopRequests = async (req, res) => {
  try {
    const requests = await prisma.shopRequest.findMany({
      include: { user: true },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

// Admin approves a request
export const approveShopRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.shopRequest.update({
      where: { id },
      data: { status: "approved" },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error approving request" });
  }
};

// Admin rejects a request
export const rejectShopRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.shopRequest.update({
      where: { id },
      data: { status: "rejected" },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error rejecting request" });
  }
};

import express from "express";

import {
  signup,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", verifyToken, logout);

export default router;

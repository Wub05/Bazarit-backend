import express from "express";

import {
  signup,
  login,
  refreshAccessToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refreshAccessToken", refreshAccessToken);

export default router;

import express from "express";
import { requestOtp, confirmOtp } from "../controllers/otpControllers";

const router = express.Router();

router.post("/request", requestOtp); // for signup/login/forgot
router.post("/verify", confirmOtp); // verify OTP code

export default router;

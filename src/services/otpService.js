import crypto from "crypto";
import { prisma } from "../lib/prisma.js";

export const generateOtp = async (phone) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const otpCount = await prisma.otpCode.count({
    where: {
      phone,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (otpCount >= 3) {
    throw new Error("Too many OTP requests. Try again in an hour.");
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Delete old OTPs
  await prisma.otpCode.deleteMany({ where: { phone } });

  // Save new OTP
  await prisma.otpCode.create({
    data: { phone, code, expiresAt, verified: false },
  });

  // Simulate SMS (MVP)
  console.log(`📲 OTP for ${phone}: ${code}`);

  return { code, expiresAt };
};

//Verify token
export const verifyOtp = async (phone, code) => {
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      expiresAt: { gte: new Date() },
      verified: false,
    },
  });

  if (!otp) {
    throw new Error("Invalid or expired OTP.");
  }

  // Mark as verified
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return true;
};

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateOtp, verifyOtp } from "../services/otpService";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();

//Create a user! || User Registeration
export const signup = async (req, res) => {
  try {
    const { name, phone, password, otp } = req.body;

    // Basic validation
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: "Phone already registered." });
    }

    // No OTP provided — generate and send OTP first
    try {
      if (!otp) {
        await generateOtp(phone);
        return res.status(200).json({
          message:
            "OTP sent to your phone. Please verify to complete registration.",
        });
      }
      // OTP provided — verify it
      const isOtpValid = await verifyOtp(phone, otp);
      if (!isOtpValid) {
        return res
          .status(401)
          .json({ error: "Invalid or expired OTP. Please try again." });
      }
    } catch (error) {
      return res.status(429).json({ error: error.message });
    }

    // OTP is valid — create user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get buyer role
    const buyerRole = await prisma.role.findUnique({
      where: { name: "buyer" },
    });
    if (!buyerRole) {
      return res.status(500).json({ error: "Buyer role not found." });
    }

    //create user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        roleId: buyerRole.id,
      },
    });

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user.id, phone: user.phone, name: user.name },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//*********** Login ******** */

export const login = async (req, res) => {
  try {
    //for now we don't want "OTP" for login (MVP)
    const { phone, password, otp } = req.body;

    //basic validation
    if (!phone || !password) {
      return res
        .status(400)
        .json({ error: "Phone and password are required." });
    }

    //check if the user exists
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Please sign up first." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid phone or password." });
    }

    //💥OTP generation not for MVP
    // if (!otp) {
    //   // No OTP: generate and send it
    //   try {
    //     await generateOtp(phone);
    //     return res.status(200).json({
    //       message: "OTP sent to your phone. Please verify to complete login.",
    //     });
    //   } catch (error) {
    //     return res.status(429).json({ error: error.message });
    //   }
    // }

    // OTP is provided: verify it

    // const isOtpValid = await verifyOtp(phone, otp);
    // if (!isOtpValid) {
    //   return res
    //     .status(401)
    //     .json({ error: "Invalid or expired OTP. Please try again." });
    // }

    // OTP verified —> generate tokens

    const accessToken = jwt.sign(
      //access token
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // access token expires in 1 day
    );

    //refreshToken
    const refreshToken = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // refresh token expires in 7 days
    );

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "Login successful.",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
};

//Refresh Token Controller

export const refreshToken = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id, phone, role } = decoded;

    const newAccessToken = jwt.sign(
      { id, phone, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    );

    return res.status(200).json({
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

// Logout controller

import prisma from "../prisma/client.js";

// Logout Controller
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(204).json({ message: "No refresh token to logout." });
    }

    // Delete the refresh token from DB
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error during logout." });
  }
};

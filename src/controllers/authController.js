import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateOtp, verifyOtp } from "../services/otpService";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();

//Create a user!
export const signup = async (req, res) => {
  try {
    const { name, phone, password, otp } = req.body;

    // Basic validation
    if (!phone || !password) {
      return res
        .status(400)
        .json({ error: "Phone and password are required." });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ error: "Phone already registered." });
    }

    if (!otp) {
      // No OTP provided — generate and send OTP first
      try {
        await generateOtp(phone);
        res.status(200).json({
          message:
            "OTP sent to your phone. Please verify to complete registration.",
        });

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
    const { phone, password, otp } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ error: "Phone and password are required." });
    }

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

    if (!otp) {
      // No OTP: generate and send it
      try {
        await generateOtp(phone);
        return res.status(200).json({
          message: "OTP sent to your phone. Please verify to complete login.",
        });
      } catch (error) {
        return res.status(429).json({ error: error.message });
      }
    }

    // OTP is provided: verify it
    const isOtpValid = await verifyOtp(phone, otp);
    if (!isOtpValid) {
      return res
        .status(401)
        .json({ error: "Invalid or expired OTP. Please try again." });
    }

    // OTP verified —> generate tokens
    const accessToken = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // access token expires in 1 day
    );

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

//refresh Token
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token missing." });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "Invalid or expired refresh token." });
      }

      const { id, phone, role } = decoded;

      // Generate new access token
      const newAccessToken = jwt.sign(
        { id, phone, role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Short-lived token (e.g. 1 hour)
      );

      return res.status(200).json({
        message: "Access token refreshed successfully.",
        accessToken: newAccessToken,
      });
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ error: "Server error refreshing token." });
  }
};

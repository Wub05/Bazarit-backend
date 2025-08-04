// src/app.js — App configuration
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import errorHandler from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

//Security & parsing
app.use(cors());
app.use(express.json());

//auth routes
app.use("/api/auth", authRoutes);

//shop routes
app.use("/api/shop", shopRoutes);

//Global error handler
app.use(errorHandler);

export default app;

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import shopRequestRoutes from "./routes/shopRequestRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import permissionRoute from "./routes/permissionRoute.js";
import roleRoute from "./routes/roleRoute.js";
import rolePermissionRoute from "./routes/rolePermissionRoute.js";
import locationRoutes from "./routes/locationRoutes.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";
import viewRoutes from "./routes/viewRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
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

//product routes
app.use("/api/product", productRoutes);

//shopRequest routes
app.use("/api/shopRequest", shopRequestRoutes);

//category routes
app.use("/api/category", categoryRoutes);

//rating routes
app.use("/api/rating", ratingRoutes);

//permission routes
app.use("/api/permission", permissionRoute);

//role routes
app.use("/api/role", roleRoute);

//rolePermission route
app.use("/api/rolePermission", rolePermissionRoute);

//location route
app.use("/api/location", locationRoutes);

//discovery route
app.use("/api/discovery", discoveryRoutes);

//view route
app.use("/api/views", viewRoutes);

//OTP routes
app.use("/api/getOtp", otpRoutes);

//Global error handler
app.use(errorHandler);

export default app;

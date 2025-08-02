import jwt from "jsonwebtoken";

// Middleware to verify access token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next(); // Continue to route handler
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

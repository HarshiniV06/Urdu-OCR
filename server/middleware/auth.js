import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "urdu-ocr-dev-secret-change-in-production";

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please sign in to continue" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await User.findById(payload.userId).select("name email");
    if (!user) return res.status(401).json({ error: "Account not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired — please sign in again" });
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await User.findById(payload.userId).select("name email");
    if (user) req.user = user;
  } catch {
    /* ignore invalid token */
  }
  next();
}

import { Router } from "express";
import User from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

export default router;

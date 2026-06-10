import { Router } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import Prediction from "../models/Prediction.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export default function createApiRoutes(mlServiceUrl, dbConnected) {
  router.get("/health", async (_req, res) => {
    let mlReady = false;
    try {
      const { data } = await axios.get(`${mlServiceUrl}/health`, { timeout: 3000 });
      mlReady = data.model_loaded;
    } catch {
      /* ml offline */
    }
    res.json({
      status: "ok",
      ready: mlReady,
      database: dbConnected,
    });
  });

  router.get("/history", requireAuth, async (req, res) => {
    if (!dbConnected) return res.json([]);
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const items = await Prediction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/history/stats", requireAuth, async (req, res) => {
    if (!dbConnected) return res.json({ total: 0 });
    try {
      const total = await Prediction.countDocuments({ user: req.user._id });
      res.json({ total });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete("/history", requireAuth, async (req, res) => {
    if (!dbConnected) return res.json({ deleted: 0 });
    try {
      const result = await Prediction.deleteMany({ user: req.user._id });
      res.json({ deleted: result.deletedCount });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/predict", optionalAuth, upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "image.png",
      contentType: req.file.mimetype,
    });
    form.append("top_k", String(req.body.top_k || 5));
    form.append("mode", req.body.mode || "character");
    form.append("input_method", req.body.input_method || "upload");

    try {
      const { data } = await axios.post(`${mlServiceUrl}/predict`, form, {
        headers: form.getHeaders(),
        timeout: 120000,
      });

      let saved = false;
      if (dbConnected && req.user) {
        await Prediction.create({
          user: req.user._id,
          mode: data.mode || req.body.mode || "character",
          recognizedText: data.text || data.top_char,
          topChar: data.top_char,
          topConfidence: data.top_confidence,
          predictions: data.predictions,
          characters: data.characters || [],
          segmentCount: data.segment_count || 1,
          fontStyle: req.body.font_style || "Unknown",
          inputMethod: req.body.input_method || "upload",
          imageName: req.file.originalname,
        });
        saved = true;
      }

      res.json({
        ...data,
        saved,
        historyNote: req.user
          ? saved
            ? "Saved to your history"
            : null
          : "Sign in to save this result to your history",
      });
    } catch (err) {
      const status = err.response?.status || 500;
      const detail = err.response?.data?.detail || err.message;
      res.status(status).json({ error: detail });
    }
  });

  return router;
}

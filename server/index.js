import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import createApiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/urdu_ocr";

const app = express();
app.use(cors());
app.use(express.json());

const dbConnected = await connectDB(MONGODB_URI);
app.use("/api/auth", authRoutes);
app.use("/api", createApiRoutes(ML_SERVICE_URL, dbConnected));
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`[server] API running at http://localhost:${PORT}`);
  console.log(`[server] ML service: ${ML_SERVICE_URL}`);
});

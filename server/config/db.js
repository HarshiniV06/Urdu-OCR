import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    console.warn("[db] No MONGODB_URI — history will not be persisted");
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
    return true;
  } catch (err) {
    console.warn("[db] MongoDB unavailable:", err.message);
    console.warn("[db] App will run without prediction history");
    return false;
  }
}

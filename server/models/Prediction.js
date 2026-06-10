import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mode: { type: String, enum: ["character", "word", "line"], default: "character" },
    recognizedText: { type: String, required: true },
    topChar: { type: String, required: true },
    topConfidence: { type: Number, required: true },
    predictions: [
      {
        rank: Number,
        char: String,
        confidence: Number,
      },
    ],
    characters: [
      {
        char: String,
        confidence: Number,
        index: Number,
        low_confidence: Boolean,
      },
    ],
    segmentCount: { type: Number, default: 1 },
    fontStyle: { type: String, default: "Unknown" },
    inputMethod: { type: String, enum: ["upload", "camera", "paste"], default: "upload" },
    imageName: String,
  },
  { timestamps: true }
);

export default mongoose.model("Prediction", predictionSchema);

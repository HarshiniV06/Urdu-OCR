"""FastAPI ML microservice for Urdu OCR inference."""

import io
import os
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from inference import UrduOCRInference, find_checkpoint

ocr: Optional[UrduOCRInference] = None
checkpoint_path: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ocr, checkpoint_path
    checkpoint_path = find_checkpoint(os.getenv("CHECKPOINT_PATH"))
    if checkpoint_path:
        print(f"[ml-service] Loading model: {checkpoint_path}")
        ocr = UrduOCRInference(checkpoint_path)
        print(f"[ml-service] Ready — {len(ocr.idx2label)} classes on {ocr.device}")
    else:
        print("[ml-service] WARNING: No checkpoint found in ml-service/checkpoints/")
    yield


app = FastAPI(title="Urdu OCR ML Service", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    checkpoint: Optional[str] = None


class InfoResponse(BaseModel):
    num_classes: int
    device: Optional[str]
    model_loaded: bool
    modes: list[str] = ["character", "word", "line"]


class PredictResponse(BaseModel):
    mode: str
    text: str
    top_char: str
    top_confidence: float
    predictions: list
    characters: list = []
    segment_count: int = 1
    word_count: Optional[int] = None


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=ocr is not None,
        checkpoint=checkpoint_path,
    )


@app.get("/info", response_model=InfoResponse)
def info():
    if ocr is None:
        return InfoResponse(num_classes=208, device=None, model_loaded=False)
    return InfoResponse(
        num_classes=len(ocr.idx2label),
        device=str(ocr.device),
        model_loaded=True,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    top_k: int = Form(5),
    mode: Literal["character", "word", "line"] = Form("character"),
    input_method: str = Form("upload"),
):
    if ocr is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Place best_model.pth in ml-service/checkpoints/",
        )
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a valid image file")

    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {exc}") from exc

    result = ocr.predict(
        img,
        mode=mode,
        top_k=min(top_k, 10),
        input_method=input_method,
    )
    return PredictResponse(**result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("ML_PORT", "8000")), reload=False)

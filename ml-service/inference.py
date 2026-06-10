"""Urdu OCR inference — character model with TTA + word/line pipelines."""

from __future__ import annotations

import os
from typing import Dict, List, Optional, Union

import cv2
import numpy as np
import timm
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms
import torchvision.transforms.functional as TF

import re

from segmentation import segment_characters, segment_text_lines, segment_words_in_line

URDU_CHAR_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]")


class DropPath(nn.Module):
    def __init__(self, drop_prob=0.0):
        super().__init__()
        self.drop_prob = drop_prob

    def forward(self, x):
        if not self.training or self.drop_prob == 0.0:
            return x
        shape = (x.shape[0],) + (1,) * (x.ndim - 1)
        keep = torch.rand(shape, device=x.device) > self.drop_prob
        return x / (1 - self.drop_prob) * keep


class TransformerBlock(nn.Module):
    def __init__(self, dim, num_heads=8, mlp_ratio=4.0, dropout=0.1, drop_path=0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, dropout=dropout, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        mlp_dim = int(dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(dim, mlp_dim), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(mlp_dim, dim), nn.Dropout(dropout))
        self.dp1 = DropPath(drop_path)
        self.dp2 = DropPath(drop_path)

    def forward(self, x):
        n = self.norm1(x)
        a, _ = self.attn(n, n, n)
        x = x + self.dp1(a)
        x = x + self.dp2(self.mlp(self.norm2(x)))
        return x


class UrduOCRNet(nn.Module):
    def __init__(self, num_classes, img_size=96, num_heads=8,
                 num_layers=4, dropout=0.2, drop_path=0.15):
        super().__init__()
        self.backbone = timm.create_model(
            "tf_efficientnetv2_s", pretrained=False,
            features_only=True, out_indices=(-1,))
        with torch.no_grad():
            dummy = torch.zeros(1, 3, img_size, img_size)
            feat = self.backbone(dummy)[0]
            self.feat_dim = feat.shape[1]
            self.seq_len = feat.shape[2] * feat.shape[3]

        self.cls_token = nn.Parameter(torch.randn(1, 1, self.feat_dim) * 0.02)
        self.pos_embed = nn.Parameter(torch.randn(1, self.seq_len + 1, self.feat_dim) * 0.02)
        dp_rates = [drop_path * i / num_layers for i in range(num_layers)]
        self.transformer = nn.Sequential(*[
            TransformerBlock(self.feat_dim, num_heads, 4.0, dropout, dp_rates[i])
            for i in range(num_layers)])
        self.norm = nn.LayerNorm(self.feat_dim)
        self.head = nn.Sequential(
            nn.Linear(self.feat_dim, self.feat_dim // 2), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(self.feat_dim // 2, num_classes))

    def forward(self, x):
        b = x.size(0)
        feat = self.backbone(x)[0]
        feat = feat.flatten(2).permute(0, 2, 1)
        cls = self.cls_token.expand(b, -1, -1)
        feat = torch.cat([cls, feat], dim=1)
        feat = feat + self.pos_embed
        feat = self.transformer(feat)
        feat = self.norm(feat)
        return self.head(feat[:, 0])


def enhance_image(pil_img: Image.Image, aggressive: bool = True) -> Image.Image:
    original_size = pil_img.size
    scale = 4 if aggressive else 2
    upscaled = pil_img.resize(
        (original_size[0] * scale, original_size[1] * scale), Image.LANCZOS)
    gray = np.array(upscaled.convert("L"))
    if gray.mean() < 128:
        gray = 255 - gray
    clahe = cv2.createCLAHE(clipLimit=3.0 if aggressive else 2.0, tileGridSize=(4, 4))
    gray = clahe.apply(gray)
    if aggressive:
        denoised = cv2.fastNlMeansDenoising(gray, h=8, templateWindowSize=7, searchWindowSize=21)
        for _ in range(2):
            blurred = cv2.GaussianBlur(denoised, (0, 0), sigmaX=1.5)
            denoised = cv2.addWeighted(denoised, 1.8, blurred, -0.8, 0)
        gray = denoised
    else:
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    result = cv2.resize(binary, original_size, interpolation=cv2.INTER_LANCZOS4)
    rgb = cv2.cvtColor(result, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(rgb)


def get_inference_transform(img_size: int = 96):
    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.5] * 3, [0.5] * 3),
    ])


def _tensorize(pil_img: Image.Image, img_size: int) -> torch.Tensor:
    tfm = get_inference_transform(img_size)
    return tfm(pil_img)


def _tta_views(pil_img: Image.Image, img_size: int) -> List[Image.Image]:
    """Deterministic test-time augmentation views."""
    gray = pil_img.convert("L")
    views = [gray]
    for angle in (-10, -5, 5, 10):
        views.append(TF.rotate(gray, angle, fill=255))
    small = TF.resize(gray, (int(img_size * 0.9), int(img_size * 0.9)))
    views.append(TF.pad(small, 5, fill=255))
    large = TF.center_crop(TF.resize(gray, (int(img_size * 1.1), int(img_size * 1.1))), img_size)
    views.append(large)
    return [v.convert("RGB") for v in views]


def find_checkpoint(explicit: Optional[str] = None) -> Optional[str]:
    if explicit and os.path.isfile(explicit):
        return os.path.abspath(explicit)
    base = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base, "checkpoints", "best_model.pth"),
        os.path.join(base, "checkpoints", "best_finetuned.pth"),
        os.path.join(base, "..", "checkpoints", "best_model.pth"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return os.path.abspath(path)
    return None


def clean_urdu_char(label: str) -> str:
    if not label:
        return "؟"
    text = str(label).strip()
    if text in ("?", "؟"):
        return "؟"
    chars = URDU_CHAR_RE.findall(text)
    if not chars:
        return text.strip("-_. ") or "؟"
    return chars[0] if len(chars) == 1 else "".join(chars)


def crop_to_white_card(pil_img: Image.Image, padding_ratio: float = 0.06) -> Image.Image:
    """Find the bright white card/screen region in a camera photo."""
    arr = np.array(pil_img.convert("RGB"))
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape

    for threshold in (210, 195, 180):
        bright = (gray >= threshold).astype(np.uint8)
        row_counts = bright.sum(axis=1)
        col_counts = bright.sum(axis=0)
        row_thresh = w * 0.22
        col_thresh = h * 0.22
        rows = np.where(row_counts >= row_thresh)[0]
        cols = np.where(col_counts >= col_thresh)[0]
        if len(rows) >= 4 and len(cols) >= 4:
            y0, y1 = int(rows[0]), int(rows[-1])
            x0, x1 = int(cols[0]), int(cols[-1])
            box_area = (x1 - x0) * (y1 - y0)
            if 0.04 * w * h < box_area < 0.92 * w * h:
                pad = int(max(x1 - x0, y1 - y0) * padding_ratio)
                x0 = max(0, x0 - pad)
                y0 = max(0, y0 - pad)
                x1 = min(w, x1 + pad)
                y1 = min(h, y1 + pad)
                return Image.fromarray(arr[y0:y1, x0:x1])

    return pil_img


def crop_to_content(pil_img: Image.Image, padding_ratio: float = 0.14) -> Image.Image:
    """Crop to ink/content — fixes camera shots with large dark borders."""
    arr = np.array(pil_img.convert("RGB"))
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    if float(gray.mean()) < 95:
        gray = 255 - gray

    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = (255 - bw) if (bw == 255).mean() > 0.5 else bw

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    coords = cv2.findNonZero(mask)
    if coords is None:
        return pil_img

    x, y, bw_box, bh_box = cv2.boundingRect(coords)
    pad = int(max(bw_box, bh_box) * padding_ratio)
    h_img, w_img = arr.shape[:2]
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(w_img, x + bw_box + pad)
    y1 = min(h_img, y + bh_box + pad)
    return Image.fromarray(arr[y0:y1, x0:x1])


def prepare_camera_image(pil_img: Image.Image) -> Image.Image:
    """Full pipeline for camera / screen photos."""
    img = crop_to_white_card(pil_img)
    img = crop_to_content(img, padding_ratio=0.08)
    return img


def _label_at(idx2label: dict, idx: int) -> str:
    raw = idx2label.get(idx, idx2label.get(str(idx), "?"))
    return clean_urdu_char(raw)


class UrduOCRInference:
    MIN_CHAR_CONFIDENCE = 35.0

    def __init__(self, checkpoint_path: str, device: str = "auto", img_size: int = 96):
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        ckpt = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
        num_classes = ckpt["num_classes"]
        self.idx2label = ckpt["idx2label"]
        self.val_top1 = ckpt.get("val_top1")

        self.model = UrduOCRNet(num_classes, img_size=img_size).to(self.device)
        self.model.load_state_dict(ckpt["model"])
        self.model.eval()
        self.img_size = img_size
        self.transform = get_inference_transform(img_size)
        self.checkpoint_path = checkpoint_path

    def _should_crop(self, pil_img: Image.Image) -> bool:
        w, h = pil_img.size
        if max(w, h) < 160:
            return False
        gray = np.array(pil_img.convert("L"))
        if float(gray.mean()) < 95:
            gray = 255 - gray
        _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        mask = (255 - bw) if (bw == 255).mean() > 0.5 else bw
        coords = cv2.findNonZero(mask)
        if coords is None:
            return False
        _, _, bw_box, bh_box = cv2.boundingRect(coords)
        return (bw_box * bh_box) / (w * h) < 0.42

    def _prepare_char_image(self, img: Image.Image) -> Image.Image:
        img = img.convert("RGB")
        w, h = img.size
        side = max(w, h)
        canvas = Image.new("RGB", (side, side), (255, 255, 255))
        canvas.paste(img, ((side - w) // 2, (side - h) // 2))
        return canvas

    def _predict_probs(
        self,
        img: Image.Image,
        use_tta: bool = True,
        use_enhance: bool = True,
        enhance_aggressive: bool = True,
    ) -> torch.Tensor:
        img = self._prepare_char_image(img)
        if use_enhance:
            img_proc = enhance_image(img, aggressive=enhance_aggressive)
        else:
            img_proc = img.convert("RGB")
        views = _tta_views(img_proc, self.img_size) if use_tta else [img_proc]
        all_probs = []
        with torch.no_grad():
            for view in views:
                inp = _tensorize(view, self.img_size).unsqueeze(0).to(self.device)
                logits = self.model(inp)
                all_probs.append(F.softmax(logits, dim=1))
        return torch.stack(all_probs).mean(dim=0).squeeze()

    def _best_probs_for_image(self, img: Image.Image, is_camera: bool = False) -> torch.Tensor:
        """Try multiple preprocess paths; pick the one with highest top-1 confidence."""
        candidates = [
            {"use_enhance": True, "enhance_aggressive": True, "use_tta": True},
            {"use_enhance": True, "enhance_aggressive": False, "use_tta": True},
        ]
        if is_camera:
            candidates.append({"use_enhance": False, "enhance_aggressive": False, "use_tta": False})

        best_probs = None
        best_top = -1.0
        for opts in candidates:
            probs = self._predict_probs(img, **opts)
            top_val = probs.max().item()
            if top_val > best_top:
                best_top = top_val
                best_probs = probs
        return best_probs

    def _format_topk(self, probs: torch.Tensor, top_k: int = 5) -> List[dict]:
        top_probs, top_idx = probs.topk(min(top_k * 2, probs.numel()))
        seen = set()
        results: List[dict] = []
        for prob, idx in zip(top_probs, top_idx):
            char = _label_at(self.idx2label, idx.item())
            if char in seen:
                continue
            seen.add(char)
            results.append({
                "rank": len(results) + 1,
                "char": char,
                "confidence": round(prob.item() * 100, 2),
            })
            if len(results) >= top_k:
                break
        return results

    def predict_character(
        self,
        image_source: Union[str, Image.Image],
        top_k: int = 5,
        input_method: Optional[str] = None,
    ) -> Dict:
        if isinstance(image_source, str):
            img = Image.open(image_source).convert("RGB")
        else:
            img = image_source.convert("RGB")

        method = (input_method or "").lower()
        is_camera = method in ("camera", "capture", "webcam")
        if is_camera:
            img = prepare_camera_image(img)
        elif self._should_crop(img):
            img = crop_to_white_card(img)
            img = crop_to_content(img)

        probs = self._best_probs_for_image(img, is_camera=is_camera)
        predictions = self._format_topk(probs, top_k)
        top = predictions[0]
        return {
            "mode": "character",
            "text": top["char"],
            "top_char": top["char"],
            "top_confidence": top["confidence"],
            "predictions": predictions,
            "characters": [
                {
                    "char": top["char"],
                    "confidence": top["confidence"],
                    "index": 0,
                }
            ],
            "segment_count": 1,
        }

    def _recognize_char_crop(self, crop: Image.Image, index: int) -> Dict:
        probs = self._predict_probs(crop, use_tta=True)
        predictions = self._format_topk(probs, 3)
        top = predictions[0]
        if top["confidence"] < self.MIN_CHAR_CONFIDENCE:
            return {
                "char": "؟",
                "confidence": top["confidence"],
                "index": index,
                "low_confidence": True,
                "alternatives": predictions,
            }
        return {
            "char": top["char"],
            "confidence": top["confidence"],
            "index": index,
            "low_confidence": False,
            "alternatives": predictions,
        }

    def _recognize_chars_from_image(self, img: Image.Image) -> List[Dict]:
        crops = segment_characters(img)
        if not crops:
            single = self.predict_character(img, top_k=3)
            return [{
                "char": single["top_char"],
                "confidence": single["top_confidence"],
                "index": 0,
                "low_confidence": single["top_confidence"] < self.MIN_CHAR_CONFIDENCE,
                "alternatives": single["predictions"],
            }]
        return [self._recognize_char_crop(c, i) for i, c in enumerate(crops)]

    def predict_word(self, image_source: Union[str, Image.Image], top_k: int = 5) -> Dict:
        img = Image.open(image_source).convert("RGB") if isinstance(image_source, str) else image_source.convert("RGB")
        chars = self._recognize_chars_from_image(img)
        text = "".join(c["char"] for c in chars)
        confs = [c["confidence"] for c in chars if c["confidence"] > 0]
        avg_conf = round(sum(confs) / len(confs), 2) if confs else 0.0
        top_char = chars[0]["char"] if chars else ""
        return {
            "mode": "word",
            "text": text,
            "top_char": top_char,
            "top_confidence": avg_conf,
            "predictions": [{"rank": 1, "char": text, "confidence": avg_conf}],
            "characters": chars,
            "segment_count": len(chars),
        }

    def predict_line(self, image_source: Union[str, Image.Image], top_k: int = 5) -> Dict:
        img = Image.open(image_source).convert("RGB") if isinstance(image_source, str) else image_source.convert("RGB")
        line_images = segment_text_lines(img)
        all_words: List[str] = []
        all_chars: List[Dict] = []
        idx = 0

        for line_img in line_images:
            word_images = segment_words_in_line(line_img)
            word_images = list(reversed(word_images))
            line_words: List[str] = []
            for word_img in word_images:
                chars = self._recognize_chars_from_image(word_img)
                for c in chars:
                    c["index"] = idx
                    idx += 1
                    all_chars.append(c)
                word_text = "".join(c["char"] for c in chars)
                if word_text:
                    line_words.append(word_text)
            if line_words:
                all_words.append(" ".join(line_words))

        text = "\n".join(all_words) if len(all_words) > 1 else (all_words[0] if all_words else "")
        confs = [c["confidence"] for c in all_chars if c["confidence"] > 0]
        avg_conf = round(sum(confs) / len(confs), 2) if confs else 0.0
        return {
            "mode": "line",
            "text": text,
            "top_char": all_chars[0]["char"] if all_chars else "",
            "top_confidence": avg_conf,
            "predictions": [{"rank": 1, "char": text, "confidence": avg_conf}],
            "characters": all_chars,
            "segment_count": len(all_chars),
            "word_count": len(all_words),
        }

    def predict(
        self,
        image_source: Union[str, Image.Image],
        mode: str = "character",
        top_k: int = 5,
        input_method: Optional[str] = None,
    ) -> Dict:
        mode = (mode or "character").lower()
        if mode == "word":
            return self.predict_word(image_source, top_k)
        if mode == "line":
            return self.predict_line(image_source, top_k)
        return self.predict_character(image_source, top_k, input_method=input_method)

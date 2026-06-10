"""Segment Urdu text images into characters for line/word OCR."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image


@dataclass
class TextBox:
    x: int
    y: int
    w: int
    h: int

    def as_tuple(self) -> Tuple[int, int, int, int]:
        return self.x, self.y, self.w, self.h


def _to_gray_array(pil_img: Image.Image) -> np.ndarray:
    return np.array(pil_img.convert("L"))


def binarize_for_segmentation(pil_img: Image.Image) -> np.ndarray:
    """Return binary image: ink=255, background=0."""
    gray = _to_gray_array(pil_img)
    if gray.mean() < 128:
        gray = 255 - gray
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    return binary


def _merge_boxes(boxes: List[TextBox], gap_tol: int) -> List[TextBox]:
    if not boxes:
        return []
    boxes = sorted(boxes, key=lambda b: b.x)
    merged = [boxes[0]]
    for box in boxes[1:]:
        prev = merged[-1]
        if box.x - (prev.x + prev.w) <= gap_tol:
            nx = min(prev.x, box.x)
            ny = min(prev.y, box.y)
            nr = max(prev.x + prev.w, box.x + box.w)
            nb = max(prev.y + prev.h, box.y + box.h)
            merged[-1] = TextBox(nx, ny, nr - nx, nb - ny)
        else:
            merged.append(box)
    return merged


def _boxes_from_contours(binary: np.ndarray, min_area_ratio: float = 0.0008) -> List[TextBox]:
    h, w = binary.shape
    min_area = h * w * min_area_ratio
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes: List[TextBox] = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        if area < min_area:
            continue
        if ch < h * 0.12 or cw < max(2, w * 0.008):
            continue
        if area > h * w * 0.65:
            continue
        boxes.append(TextBox(x, y, cw, ch))
    return boxes


def _split_columns_by_gaps(binary: np.ndarray, gap_ratio: float = 0.02) -> List[TextBox]:
    h, w = binary.shape
    proj = np.sum(binary > 0, axis=0)
    threshold = max(1, h * gap_ratio)
    boxes: List[TextBox] = []
    in_gap = True
    start = 0
    for x, val in enumerate(proj):
        if val <= threshold and not in_gap:
            if x - start >= max(3, w * 0.01):
                col = binary[:, start:x]
                rows = np.where(np.sum(col > 0, axis=1) > 0)[0]
                if len(rows):
                    y1, y2 = rows[0], rows[-1]
                    boxes.append(TextBox(start, y1, x - start, y2 - y1 + 1))
            in_gap = True
        elif val > threshold and in_gap:
            start = x
            in_gap = False
    if not in_gap and w - start >= max(3, w * 0.01):
        col = binary[:, start:w]
        rows = np.where(np.sum(col > 0, axis=1) > 0)[0]
        if len(rows):
            y1, y2 = rows[0], rows[-1]
            boxes.append(TextBox(start, y1, w - start, y2 - y1 + 1))
    return boxes


def _sort_rtl(boxes: List[TextBox]) -> List[TextBox]:
    return sorted(boxes, key=lambda b: b.x + b.w / 2, reverse=True)


def segment_characters(pil_img: Image.Image) -> List[Image.Image]:
    """Extract single-character crops from a word or line image."""
    binary = binarize_for_segmentation(pil_img)
    h, w = binary.shape
    boxes = _boxes_from_contours(binary)

    if len(boxes) <= 1 and w > h * 1.5:
        boxes = _split_columns_by_gaps(binary)
    elif len(boxes) > 1 and w / max(len(boxes), 1) > h * 0.8:
        gap_boxes = _split_columns_by_gaps(binary)
        if len(gap_boxes) > len(boxes):
            boxes = gap_boxes

    boxes = _merge_boxes(boxes, gap_tol=max(2, int(w * 0.01)))
    boxes = _sort_rtl(boxes)

    rgb = np.array(pil_img.convert("RGB"))
    crops: List[Image.Image] = []
    for box in boxes:
        pad = max(4, int(min(box.w, box.h) * 0.15))
        x1 = max(0, box.x - pad)
        y1 = max(0, box.y - pad)
        x2 = min(w, box.x + box.w + pad)
        y2 = min(h, box.y + box.h + pad)
        crop = rgb[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        side = max(crop.shape[0], crop.shape[1])
        canvas = np.full((side, side, 3), 255, dtype=np.uint8)
        oy = (side - crop.shape[0]) // 2
        ox = (side - crop.shape[1]) // 2
        canvas[oy : oy + crop.shape[0], ox : ox + crop.shape[1]] = crop
        crops.append(Image.fromarray(canvas))
    return crops


def segment_text_lines(pil_img: Image.Image) -> List[Image.Image]:
    """Split a multi-line page into single-line images."""
    binary = binarize_for_segmentation(pil_img)
    h, w = binary.shape
    row_proj = np.sum(binary > 0, axis=1)
    threshold = max(1, w * 0.02)
    lines: List[Image.Image] = []
    rgb = np.array(pil_img.convert("RGB"))
    in_gap = True
    start = 0
    for y, val in enumerate(row_proj):
        if val <= threshold and not in_gap:
            if y - start >= max(8, h * 0.08):
                pad = max(2, int((y - start) * 0.05))
                y1 = max(0, start - pad)
                y2 = min(h, y + pad)
                lines.append(Image.fromarray(rgb[y1:y2, :]))
            in_gap = True
        elif val > threshold and in_gap:
            start = y
            in_gap = False
    if not in_gap and h - start >= max(8, h * 0.08):
        pad = max(2, int((h - start) * 0.05))
        lines.append(Image.fromarray(rgb[max(0, start - pad) : h, :]))
    return lines if lines else [pil_img.convert("RGB")]


def segment_words_in_line(pil_img: Image.Image) -> List[Image.Image]:
    """Split a single line into word images using wide vertical gaps."""
    binary = binarize_for_segmentation(pil_img)
    h, w = binary.shape
    proj = np.sum(binary > 0, axis=0)
    threshold = max(1, h * 0.04)
    rgb = np.array(pil_img.convert("RGB"))
    words: List[Image.Image] = []
    in_gap = True
    start = 0
    min_word_w = max(8, int(w * 0.03))
    for x, val in enumerate(proj):
        if val <= threshold and not in_gap:
            if x - start >= min_word_w:
                col = binary[:, start:x]
                rows = np.where(np.sum(col > 0, axis=1) > 0)[0]
                if len(rows):
                    y1, y2 = rows[0], rows[-1]
                    pad = max(2, int((y2 - y1) * 0.08))
                    y1 = max(0, y1 - pad)
                    y2 = min(h, y2 + pad)
                    words.append(Image.fromarray(rgb[y1:y2, start:x]))
            in_gap = True
        elif val > threshold and in_gap:
            start = x
            in_gap = False
    if not in_gap and w - start >= min_word_w:
        col = binary[:, start:w]
        rows = np.where(np.sum(col > 0, axis=1) > 0)[0]
        if len(rows):
            y1, y2 = rows[0], rows[-1]
            pad = max(2, int((y2 - y1) * 0.08))
            y1 = max(0, y1 - pad)
            y2 = min(h, y2 + pad)
            words.append(Image.fromarray(rgb[y1:y2, start:w]))
    return _sort_rtl_words(words) if words else [pil_img.convert("RGB")]


def _sort_rtl_words(words: List[Image.Image]) -> List[Image.Image]:
    if len(words) <= 1:
        return words
    indexed = [(i, np.array(w).shape[1]) for i, w in enumerate(words)]
    return words

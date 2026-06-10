/**
 * Crop camera photos to the white character card (e.g. screen showing one letter).
 * Uses row/column projection — same logic as the ML service.
 */
function cropWhiteCard(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (const threshold of [210, 195, 180]) {
    const rowCounts = new Uint32Array(height);
    const colCounts = new Uint32Array(width);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum >= threshold) {
          rowCounts[y]++;
          colCounts[x]++;
        }
      }
    }

    const rowThresh = width * 0.22;
    const colThresh = height * 0.22;

    let y0 = -1;
    let y1 = -1;
    let x0 = -1;
    let x1 = -1;

    for (let y = 0; y < height; y++) {
      if (rowCounts[y] >= rowThresh) {
        if (y0 < 0) y0 = y;
        y1 = y;
      }
    }
    for (let x = 0; x < width; x++) {
      if (colCounts[x] >= colThresh) {
        if (x0 < 0) x0 = x;
        x1 = x;
      }
    }

    if (y0 < 0 || x0 < 0 || y1 - y0 < 4 || x1 - x0 < 4) continue;

    const boxArea = (x1 - x0) * (y1 - y0);
    const imgArea = width * height;
    if (boxArea > 0.04 * imgArea && boxArea < 0.92 * imgArea) {
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.06);
      return {
        x: Math.max(0, x0 - pad),
        y: Math.max(0, y0 - pad),
        w: Math.min(width, x1 + pad) - Math.max(0, x0 - pad),
        h: Math.min(height, y1 + pad) - Math.max(0, y0 - pad),
      };
    }
  }

  return null;
}

function cropInkBounds(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum > 175 || lum < 70) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const pad = Math.round(Math.max(boxW, boxH) * 0.08);
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(width, maxX + pad) - Math.max(0, minX - pad),
    h: Math.min(height, maxY + pad) - Math.max(0, minY - pad),
  };
}

function canvasToPngFile(canvas, name = "capture.png") {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], name, { type: "image/png" }) : null),
      "image/png",
      1
    );
  });
}

/** Crop + normalise camera captures before sending to the API. */
export function preprocessCameraImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        const src = document.createElement("canvas");
        const sctx = src.getContext("2d", { willReadFrequently: true });
        src.width = img.naturalWidth;
        src.height = img.naturalHeight;
        sctx.drawImage(img, 0, 0);

        let box = cropWhiteCard(sctx, src.width, src.height);
        let work = src;

        if (box) {
          const step1 = document.createElement("canvas");
          step1.width = box.w;
          step1.height = box.h;
          step1.getContext("2d").drawImage(src, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
          work = step1;
        }

        const wctx = work.getContext("2d", { willReadFrequently: true });
        const ink = cropInkBounds(wctx, work.width, work.height);

        const out = document.createElement("canvas");
        if (ink) {
          out.width = ink.w;
          out.height = ink.h;
          out.getContext("2d").drawImage(work, ink.x, ink.y, ink.w, ink.h, 0, 0, ink.w, ink.h);
        } else {
          out.width = work.width;
          out.height = work.height;
          out.getContext("2d").drawImage(work, 0, 0);
        }

        const processed = await canvasToPngFile(out);
        resolve(processed || file);
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

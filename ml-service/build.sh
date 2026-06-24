#!/usr/bin/env bash
set -euo pipefail

mkdir -p checkpoints

if [ -f "checkpoints/best_model.pth" ]; then
  echo "[build] Model already present."
elif [ -n "${MODEL_DOWNLOAD_URL:-}" ]; then
  echo "[build] Downloading model from MODEL_DOWNLOAD_URL..."
  curl -fsSL "$MODEL_DOWNLOAD_URL" -o checkpoints/best_model.pth
  echo "[build] Downloaded $(du -h checkpoints/best_model.pth | cut -f1)"
else
  echo "[build] WARNING: No model file and MODEL_DOWNLOAD_URL not set."
fi

pip install -r requirements.txt

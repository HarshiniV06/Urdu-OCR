# Urdu OCR — MERN Stack Minor Project

AI-powered **Urdu character recognition** built on the **MMU-OCR-21** dataset (Kaggle). Recognises **208 Urdu characters** across Naskh, Nastaleeq, and Tehreer font styles using **EfficientNetV2-S + Transformer**.

## Architecture

| Layer | Technology | Role |
|-------|------------|------|
| **M**ongoDB | Mongoose | Stores prediction history |
| **E**xpress | Node.js | REST API gateway |
| **R**eact | Vite + Tailwind | Modern responsive UI |
| **N**ode | npm | Runtime for Express |
| ML Service | Python + FastAPI + PyTorch | Model inference |

```
React (5173) ──▶ Express (5000) ──▶ FastAPI (8000) ──▶ PyTorch Model
                      │
                      ▼
                  MongoDB
```

## Quick Start (Windows)

### 1. Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Python](https://python.org) 3.10+
- [MongoDB](https://www.mongodb.com/try/download/community) (optional — for history)

### 2. Add your trained model

Export `best_model.pth` from your [Colab notebook](https://colab.research.google.com/drive/19rGOWOaApSAQFUcTDdNRXGVaZlqHWVXC) and place it in:

```
ml-service/checkpoints/best_model.pth
```

### 3. Install & run

**Option A — One-click (Windows):**

```bat
start.bat
```

**Option B — Manual (3 terminals):**

```bash
# Terminal 1 — ML service
cd ml-service
pip install -r requirements.txt
python main.py

# Terminal 2 — Express API
cd server
npm install
npm run dev

# Terminal 3 — React UI
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

### Production build

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start
# Serves built React app + API on http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System status |
| GET | `/api/info` | Model metadata |
| GET | `/api/stats` | Prediction statistics |
| GET | `/api/history` | MongoDB history |
| POST | `/api/predict` | Upload image → predictions |
| DELETE | `/api/history` | Clear history |

## Features

- Drag-and-drop, camera capture, and clipboard paste
- Top-5 predictions with animated confidence bars
- MongoDB prediction history page
- About page with architecture & model details
- Auto-analyse on upload
- Dark theme with Urdu typography (Noto Nastaliq Urdu)

## Model Details

- **Backbone:** EfficientNetV2-S (pretrained features)
- **Head:** 4-layer Transformer (8 heads) + MLP
- **Training:** AdamW, OneCycleLR, MixUp/CutMix augmentation
- **Expected accuracy:** ~72.9% Top-1, ~99.5% Top-5 (50 epochs)

## Project Structure

```
Urdu_OCR_Project/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express + MongoDB API
├── ml-service/      # Python FastAPI + PyTorch inference
├── start.bat        # Windows launcher
└── README.md
```

## Colab → Local Model Export

In your Colab notebook after training:

```python
from google.colab import files
files.download('/content/checkpoints/best_model.pth')
```

Place the downloaded file in `ml-service/checkpoints/`.

## Licence

MIT — Dataset: MMU-OCR-21 (CDLA-Permissive-1.0)

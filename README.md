# Urdu OCR — Deep Learning Based Urdu Character Recognition System

A full-stack AI-powered Optical Character Recognition (OCR) system for Urdu script, capable of recognizing 208 Urdu characters across multiple writing styles using a hybrid EfficientNetV2-S + Transformer architecture.

Built on the MMU-OCR-21 dataset, the system combines deep visual feature extraction, attention-based sequence modeling, and a modern MERN-stack application to deliver real-time Urdu character recognition through an intuitive web interface.

---

# Overview

Urdu OCR addresses the challenge of digitizing handwritten and printed Urdu text, a task that remains significantly more difficult than Latin-script OCR due to complex character shapes, contextual variations, and multiple writing styles.

The project evolved from a deep learning research prototype developed in Google Colab into a complete production-oriented application featuring:

* Deep Learning-based character recognition
* Real-time inference through FastAPI
* MERN-stack backend services
* Interactive React dashboard
* Prediction history management using MongoDB
* Modern responsive user interface

Core outcomes:

* Recognition of 208 Urdu character classes
* Support for Naskh, Nastaleeq, and Tehreer writing styles
* Top-5 prediction visualization with confidence scores
* End-to-end AI deployment architecture
* Full-stack integration of Machine Learning and Web Technologies

---

# Problem

While OCR systems for English and other Latin-based languages have achieved near-human performance, Urdu remains a challenging language for automated recognition due to:

* Complex ligature structures
* Similar-looking character classes
* Multiple writing styles
* Context-sensitive character formation
* Limited availability of large-scale annotated datasets

Traditional OCR systems struggle to generalize across different Urdu fonts and handwriting styles, leading to poor recognition accuracy in real-world applications.

---

# Solution

Urdu OCR leverages a hybrid deep learning architecture that combines convolutional feature extraction with transformer-based contextual modeling.

Pipeline Workflow:

Image Upload
|
v
Image Preprocessing
|
v
EfficientNetV2-S Backbone
|
v
Feature Embedding Layer
|
v
Transformer Encoder
|
v
Classification Head
|
v
Top-K Predictions
|
v
FastAPI Inference Service
|
v
Express API Layer
|
v
MongoDB Storage
|
v
React Dashboard

The model extracts visual features from Urdu characters and uses self-attention mechanisms to learn discriminative representations that improve classification accuracy across multiple writing styles.

---

# Results

| Metric                  | Performance               |
| ----------------------- | ------------------------- |
| Character Classes       | 208                       |
| Dataset                 | MMU-OCR-21                |
| Writing Styles          | Naskh, Nastaleeq, Tehreer |
| Top-1 Accuracy          | ~72.9%                    |
| Top-5 Accuracy          | ~99.5%                    |
| Training Epochs         | 50                        |
| Deployment Architecture | MERN + FastAPI + PyTorch  |

The model demonstrates strong recognition capability, achieving near-perfect Top-5 performance across the complete character set.

---

# Architecture

Frontend (React + Vite)
|
v
Backend API (Express.js)
|
v
ML Service (FastAPI)
|
v
EfficientNetV2-S + Transformer
|
v
Prediction Engine
|
+------------------+
|                  |
v                  v
MongoDB         Response API
History DB       Top-5 Results

---

# System Components

## Frontend Layer

Provides an intuitive interface for:

* Image Upload
* Drag-and-Drop Support
* Camera Capture
* Clipboard Paste
* Prediction Visualization
* Confidence Analytics
* Prediction History

Built using:

* React
* Vite
* Tailwind CSS

---

## Backend Layer

Acts as the middleware between frontend and ML services.

Responsibilities:

* API Routing
* Request Validation
* History Management
* Analytics Endpoints
* Service Communication

Built using:

* Node.js
* Express.js
* MongoDB
* Mongoose

---

## Machine Learning Layer

Responsible for:

* Image Preprocessing
* Feature Extraction
* Inference
* Probability Generation

Built using:

* Python
* FastAPI
* PyTorch

---

# Dataset Statistics

Dataset: MMU-OCR-21

Characteristics:

* 208 Urdu Character Classes
* Multi-font dataset
* Includes Naskh style samples
* Includes Nastaleeq style samples
* Includes Tehreer style samples
* Designed specifically for Urdu OCR research

The dataset enables robust learning across multiple script representations commonly encountered in Urdu documents.

---

# Model Architecture

## Backbone

EfficientNetV2-S

Purpose:

* Extract high-level visual representations
* Efficient parameter utilization
* Strong feature generalization

---

## Transformer Head

4-Layer Transformer Encoder

Configuration:

* 8 Attention Heads
* Multi-Head Self Attention
* Feed Forward Layers
* Context-Aware Feature Modeling

Purpose:

* Capture relationships between learned visual features
* Improve discrimination between visually similar characters

---

## Classification Layer

Multi-Layer Perceptron (MLP)

Purpose:

* Generate probability distribution across 208 classes
* Produce Top-K predictions

---

# Training Configuration

| Hyperparameter         | Value      |
| ---------------------- | ---------- |
| Optimizer              | AdamW      |
| Scheduler              | OneCycleLR |
| Epochs                 | 50         |
| Augmentation           | MixUp      |
| Augmentation           | CutMix     |
| Transfer Learning      | Yes        |
| Test-Time Augmentation | Enabled    |
| Framework              | PyTorch    |

Training strategies were selected to improve generalization and reduce overfitting on visually similar character classes.

---

# Key Design Decisions

## EfficientNetV2-S over Traditional CNNs

EfficientNetV2-S provides superior feature extraction efficiency while maintaining manageable computational requirements.

## Transformer-Based Classification

Instead of relying solely on convolutional layers, attention mechanisms enable richer contextual feature learning.

## FastAPI for Inference

FastAPI offers low-latency model serving and efficient integration with the Node.js backend.

## Modular Service Architecture

The application separates:

* User Interface
* Backend Services
* Machine Learning Inference

allowing independent scaling and maintenance.

## MongoDB Prediction History

Prediction records are stored to enable future analytics and user tracking capabilities.

---

# Features

### OCR Prediction

Upload an Urdu character image and receive:

* Predicted Character
* Confidence Score
* Top-5 Candidate Predictions

### Multiple Input Methods

Supports:

* File Upload
* Drag-and-Drop
* Camera Capture
* Clipboard Paste

### Prediction History

Store and review previous predictions through MongoDB integration.

### AI-Powered Inference

Real-time predictions using deep learning-based OCR models.

### Modern User Experience

* Responsive Design
* Dark Theme
* Urdu Typography Support
* Interactive Visualizations

---

# REST API Endpoints

| Method | Endpoint     | Description              |
| ------ | ------------ | ------------------------ |
| GET    | /api/health  | Service health check     |
| GET    | /api/info    | Model information        |
| GET    | /api/stats   | Prediction statistics    |
| GET    | /api/history | Prediction history       |
| POST   | /api/predict | OCR inference            |
| DELETE | /api/history | Clear prediction history |

---

# Project Structure

Urdu_OCR_Project/
├── client/
│   ├── src/
│   └── public/
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── middleware/
│
├── ml-service/
│   ├── checkpoints/
│   ├── models/
│   ├── utils/
│   └── main.py
│
├── start.bat
└── README.md

---

# Getting Started

## Prerequisites

* Python 3.10+
* Node.js 18+
* MongoDB
* PyTorch

---

## Installation

```bash
git clone https://github.com/HarshiniV06/Urdu-OCR.git
cd Urdu-OCR
```

### Start ML Service

```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

### Start Backend

```bash
cd server
npm install
npm run dev
```

### Start Frontend

```bash
cd client
npm install
npm run dev
```

Open:

http://localhost:5173

---

# Future Work

Potential research and engineering extensions include:

* Word-Level Urdu OCR
* Sentence-Level Recognition
* Handwritten Urdu Recognition
* Transformer-Only Vision Architectures
* Multilingual OCR Support
* ONNX/TensorRT Optimization
* Cloud Deployment Pipeline
* Mobile OCR Application

---

# Limitations

* Character-level recognition only
* Performance depends on image quality
* Single-character classification setting
* Deployment requires separate ML service hosting
* Limited evaluation on handwritten data

---

# References

Dataset:
MMU-OCR-21 Urdu Character Recognition Dataset

Frameworks:

* PyTorch
* FastAPI
* React
* Express.js
* MongoDB

This project demonstrates the integration of Deep Learning, Computer Vision, MLOps, and Full-Stack Development to build a complete AI-powered Urdu Character Recognition platform capable of real-world deployment.

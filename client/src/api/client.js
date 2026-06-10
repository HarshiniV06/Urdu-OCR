import axios from "axios";
import { getToken } from "../utils/authStorage";

const api = axios.create({
  baseURL: "/api",
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function fetchHistory(limit = 50) {
  const { data } = await api.get("/history", { params: { limit } });
  return data;
}

export async function clearHistory() {
  const { data } = await api.delete("/history");
  return data;
}

export async function predictImage(file, { fontStyle, inputMethod, topK = 5 } = {}) {
  const form = new FormData();
  form.append("image", file);
  form.append("font_style", fontStyle || "Unknown");
  form.append("input_method", inputMethod || "upload");
  form.append("top_k", String(topK));
  form.append("mode", "character");
  const { data } = await api.post("/predict", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export default api;

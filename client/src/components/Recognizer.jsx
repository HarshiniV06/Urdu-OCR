import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  ClipboardPaste,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import PredictionCard from "./PredictionCard";
import { predictImage } from "../api/client";
import { preprocessCameraImage } from "../utils/imagePreprocess";

const FONTS = [
  { id: "Naskh", label: "Naskh", hint: "Standard print style" },
  { id: "Nastaleeq", label: "Nastaleeq", hint: "Flowing calligraphy" },
  { id: "Tehreer", label: "Tehreer", hint: "Handwritten style" },
];

const INPUT_TABS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "paste", label: "Paste", icon: ClipboardPaste },
];

export default function Recognizer() {
  const [inputTab, setInputTab] = useState("upload");
  const [font, setFont] = useState("Naskh");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [historyNote, setHistoryNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRun, setAutoRun] = useState(true);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Camera access denied. Try uploading an image instead.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (inputTab === "camera") startCamera();
    else stopCamera();
    return stopCamera;
  }, [inputTab, startCamera, stopCamera]);

  const runPredict = useCallback(async (imageFile) => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setHistoryNote(null);
    try {
      const data = await predictImage(imageFile, {
        fontStyle: font,
        inputMethod: inputTab,
      });
      setResult(data);
      setHistoryNote(data.historyNote);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Recognition failed");
    } finally {
      setLoading(false);
    }
  }, [font, inputTab]);

  const loadFile = useCallback(
    (f) => {
      if (!f?.type?.startsWith("image/")) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError(null);
      if (autoRun) runPredict(f);
    },
    [autoRun, runPredict]
  );

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setHistoryNote(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera is still starting — wait a second and try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const raw = new File([blob], "capture.png", { type: "image/png" });
          const processed = await preprocessCameraImage(raw);
          loadFile(processed);
        } catch {
          loadFile(new File([blob], "capture.png", { type: "image/png" }));
        }
      },
      "image/png",
      1
    );
  };

  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        setInputTab("paste");
        loadFile(item.getAsFile());
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="glass-strong overflow-hidden rounded-3xl ring-1 ring-white/[0.06]">
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent px-6 py-4">
          <h3 className="font-display text-lg text-white">Upload your character</h3>
          <p className="text-sm text-white/40">One isolated Urdu letter works best</p>
        </div>

        <div className="flex border-b border-white/[0.06] p-1.5">
          {INPUT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setInputTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition ${
                inputTab === id ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="border-b border-white/[0.06] px-5 py-4">
          <p className="mb-2 text-xs text-white/40">Writing style</p>
          <div className="flex gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                title={f.hint}
                className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition ${
                  font === f.id
                    ? "bg-gold/15 text-gold ring-1 ring-gold/30"
                    : "bg-white/[0.03] text-white/45 hover:text-white/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex min-h-[340px] items-center justify-center bg-black/50 p-8"
            >
              <img
                src={preview}
                alt="Preview"
                className="max-h-80 max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              />
              <button
                onClick={clearImage}
                className="absolute right-5 top-5 rounded-xl bg-black/70 p-2.5 text-white/80 backdrop-blur hover:text-white"
              >
                <X size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div key={inputTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {inputTab === "upload" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  className={`flex min-h-[340px] cursor-pointer flex-col items-center justify-center gap-5 p-10 transition ${
                    dragging ? "bg-emerald/10" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-gold/5 ring-1 ring-gold/30">
                    <Upload className="text-gold" size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-white/85">Drop your image here</p>
                    <p className="mt-2 text-sm text-white/35">PNG, JPG or JPEG · click to browse</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
                </div>
              )}
              {inputTab === "camera" && (
                <div className="p-6">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <p className="mt-4 text-center text-xs leading-relaxed text-white/40">
                    Fill the frame with the white character box. For best accuracy, use Upload or Paste instead of photographing a screen.
                  </p>
                  <button onClick={capturePhoto} className="btn-primary mt-4 w-full !py-3.5">
                    <Camera size={18} />
                    Take photo
                  </button>
                </div>
              )}
              {inputTab === "paste" && (
                <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 p-10">
                  <ClipboardPaste className="text-white/25" size={40} />
                  <p className="font-display text-xl text-white/70">Press Ctrl + V</p>
                  <p className="text-sm text-white/35">Paste a screenshot anywhere on this page</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/45">
            <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="accent-gold" />
            Auto-recognise
          </label>
          <button onClick={() => runPredict(file)} disabled={!file || loading} className="btn-primary !px-6 !py-3">
            <Sparkles size={16} />
            Recognise
          </button>
        </div>
      </div>

      <PredictionCard result={result} loading={loading} historyNote={historyNote} />
    </div>
  );
}

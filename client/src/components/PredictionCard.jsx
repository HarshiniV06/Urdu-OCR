import { motion } from "framer-motion";
import { Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { confidenceLabel } from "../utils/confidence";
import { sanitizeUrduChar } from "../utils/urduLabel";
import { useAuth } from "../context/AuthContext";

function uniqueAlternatives(predictions, topChar) {
  const seen = new Set([topChar]);
  return (predictions || [])
    .map((p) => ({
      ...p,
      char: sanitizeUrduChar(p.char),
      confidence: Number(p.confidence) || 0,
    }))
    .filter((p) => {
      if (!p.char || p.char === "؟" || seen.has(p.char)) return false;
      seen.add(p.char);
      return true;
    })
    .slice(0, 4);
}

export default function PredictionCard({ result, loading, historyNote }) {
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="glass-strong flex min-h-[520px] flex-col items-center justify-center rounded-3xl p-8">
        <div className="relative mb-8">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          <Sparkles className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gold/60" size={20} />
        </div>
        <p className="font-display text-xl text-white/70">Reading your character…</p>
        <p className="mt-2 text-sm text-white/35">This usually takes a few seconds</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-strong flex min-h-[520px] flex-col items-center justify-center rounded-3xl p-8 text-center">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold/10 to-transparent ring-1 ring-gold/20">
          <span className="font-urdu text-6xl text-white/20" dir="rtl" lang="ur">؟</span>
        </div>
        <p className="font-display text-2xl text-white/55">Your result appears here</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/35">
          Upload a clear image of one Urdu letter and click Recognise
        </p>
      </div>
    );
  }

  const char = sanitizeUrduChar(result.top_char || result.text || "");
  const confidence = result.top_confidence ?? 0;
  const { label, tone } = confidenceLabel(confidence);
  const alternatives = uniqueAlternatives(result.predictions, char);

  const toneClasses = {
    emerald: "bg-emerald/15 text-emerald-light ring-emerald/30",
    gold: "bg-gold/15 text-gold-light ring-gold/30",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    muted: "bg-white/10 text-white/50 ring-white/20",
  };

  const copyChar = async () => {
    await navigator.clipboard.writeText(char);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong overflow-hidden rounded-3xl"
    >
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-gold/8 via-transparent to-emerald/5 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">Recognition result</p>
      </div>

      <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex h-44 w-44 items-center justify-center rounded-3xl bg-white/[0.03] ring-1 ring-white/[0.08]">
          <motion.span
            key={char}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="font-urdu text-[120px] leading-none text-white drop-shadow-[0_0_40px_rgba(212,160,23,0.25)]"
            dir="rtl"
            lang="ur"
          >
            <bdi>{char}</bdi>
          </motion.span>
        </div>

        <p className="mt-6 font-display text-3xl font-semibold tabular-nums text-white">
          {confidence.toFixed(1)}%
        </p>
        <span className={`mt-3 inline-flex rounded-full px-5 py-2 text-sm font-medium ring-1 ${toneClasses[tone]}`}>
          {label}
        </span>

        {confidence < 40 && (
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-amber-200/80">
            Low confidence — try Upload or Paste with a clear screenshot for a more accurate result.
          </p>
        )}

        <button onClick={copyChar} className="btn-ghost mt-8">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy character"}
        </button>

        {historyNote && (
          <p className="mt-5 text-xs text-white/35">
            {historyNote}
            {!isAuthenticated && (
              <>
                {" · "}
                <Link to="/signup" className="text-gold hover:underline">Sign up</Link> to save history
              </>
            )}
          </p>
        )}
      </div>

      {alternatives.length > 0 && (
        <div className="border-t border-white/[0.06] px-6 py-6">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
            Other possibilities
          </p>
          <div className="space-y-3">
            {alternatives.map((p, i) => (
              <motion.div
                key={`${p.char}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 rounded-xl bg-white/[0.02] px-4 py-3"
              >
                <span className="w-5 shrink-0 text-xs tabular-nums text-white/30">{i + 2}</span>
                <bdi
                  className="font-urdu w-10 shrink-0 text-center text-3xl text-white/90"
                  dir="rtl"
                  lang="ur"
                >
                  {p.char}
                </bdi>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-white/25"
                    initial={{ width: 0 }}
                    animate={{ width: `${p.confidence}%` }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-white/40">
                  {p.confidence.toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

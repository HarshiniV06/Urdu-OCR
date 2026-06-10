import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Clock, ScrollText } from "lucide-react";
import { fetchHistory, clearHistory } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { confidenceLabel } from "../utils/confidence";
import { sanitizeUrduChar } from "../utils/urduLabel";

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchHistory());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!confirm("Remove all items from your history?")) return;
    await clearHistory();
    load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gold/80">Your personal archive</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">
            Hello, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-2 text-white/45">
            Characters you&apos;ve recognised during this browser session appear here.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClear} className="btn-ghost self-start !text-red-300 hover:!border-red-400/30">
            <Trash2 size={14} />
            Clear history
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-strong flex flex-col items-center justify-center rounded-3xl py-24 text-center">
          <ScrollText className="mb-4 text-white/20" size={48} />
          <p className="font-display text-xl text-white/50">Nothing here yet</p>
          <p className="mt-2 max-w-sm text-sm text-white/35">
            Recognise a character on the home page — we&apos;ll save it here for you automatically.
          </p>
          <Link to="/" className="btn-primary mt-8">
            Recognise a character
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const { label } = confidenceLabel(item.topConfidence);
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-5 transition hover:ring-1 hover:ring-gold/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-urdu text-6xl text-white" dir="rtl" lang="ur">
                    <bdi>{sanitizeUrduChar(item.topChar)}</bdi>
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50">
                    {label}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.predictions?.slice(0, 5).map((p) => (
                    <span
                      key={p.rank}
                      className="rounded-lg bg-white/[0.04] px-2.5 py-1 font-urdu text-base text-white/65"
                    >
                      <bdi>{sanitizeUrduChar(p.char)}</bdi>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                  <Clock size={12} />
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

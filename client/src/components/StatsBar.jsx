import { motion } from "framer-motion";

const items = [
  { key: "classes", label: "Classes", suffix: "" },
  { key: "fonts", label: "Font Styles", suffix: "" },
  { key: "total", label: "Predictions", suffix: "" },
  { key: "accuracy", label: "Val Accuracy", suffix: "%" },
];

export default function StatsBar({ info, stats }) {
  const values = {
    classes: info?.num_classes ?? 208,
    fonts: 3,
    total: stats?.totalPredictions ?? 0,
    accuracy: info?.val_top1 ? info.val_top1.toFixed(1) : "—",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass rounded-xl px-4 py-4"
        >
          <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
            {values[item.key]}
            {item.suffix && values[item.key] !== "—" ? item.suffix : ""}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
            {item.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

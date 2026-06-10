import { motion } from "framer-motion";

export default function StatusBadge({ online, modelLoaded, database }) {
  const color = !online
    ? "bg-red-500"
    : !modelLoaded
      ? "bg-amber-500"
      : "bg-emerald";

  const label = !online
    ? "Offline"
    : !modelLoaded
      ? "No model"
      : "Ready";

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 rounded-full glass px-3 py-1.5"
    >
      <span className={`h-2 w-2 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
      <span className="font-mono text-[11px] text-white/70">{label}</span>
      {database && (
        <span className="hidden font-mono text-[10px] text-white/30 sm:inline">
          · DB {database}
        </span>
      )}
    </motion.div>
  );
}

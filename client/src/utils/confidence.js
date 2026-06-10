export function confidenceLabel(value) {
  if (value >= 90) return { label: "Highly confident", tone: "emerald" };
  if (value >= 75) return { label: "Confident match", tone: "gold" };
  if (value >= 55) return { label: "Likely match", tone: "amber" };
  return { label: "Best guess", tone: "muted" };
}

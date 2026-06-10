const URDU_CHAR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

/** Keep only Urdu script from a model label (strips stray ASCII/punctuation). */
export function sanitizeUrduChar(label) {
  if (!label) return "؟";
  const text = String(label).trim();
  if (text === "?" || text === "؟") return "؟";
  const chars = text.match(URDU_CHAR);
  if (!chars?.length) return text.replace(/^[\s\-_.]+|[\s\-_.]+$/g, "") || "؟";
  return chars.length === 1 ? chars[0] : chars.join("");
}

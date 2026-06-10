import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Globe, PenLine, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: PenLine,
    title: "Single character focus",
    desc: "Designed to recognise one Urdu letter at a time with high clarity and helpful alternatives.",
  },
  {
    icon: Globe,
    title: "Built for Urdu",
    desc: "Trained on Urdu letterforms across Naskh, Nastaleeq, and Tehreer writing styles.",
  },
  {
    icon: Shield,
    title: "Session-based sign in",
    desc: "Your login lasts for this browser session only — you'll sign in fresh when you return.",
  },
  {
    icon: Heart,
    title: "Made for learning",
    desc: "Ideal for students, researchers, and anyone exploring Urdu calligraphy.",
  },
];

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="font-urdu text-5xl text-gold/80">ہمارے بارے میں</span>
        <h1 className="mt-6 font-display text-4xl font-semibold text-white sm:text-5xl">
          Urdu character recognition, reimagined
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
          Urdu OCR helps you identify individual Urdu letters from photos, scans, or camera captures.
          Upload an image, and we tell you which character it is — with alternatives if you need them.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="glass rounded-2xl p-8"
          >
            <f.icon className="mb-4 text-gold" size={24} />
            <h3 className="font-display text-xl text-white">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/45">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-strong mt-16 rounded-3xl p-12 text-center ring-1 ring-gold/15"
      >
        <Sparkles className="mx-auto mb-4 text-gold" size={28} />
        <h2 className="font-display text-2xl text-white">Ready to try it?</h2>
        <p className="mt-3 text-white/45">Upload a single Urdu character and see the result instantly.</p>
        <Link to="/#recognize" className="btn-primary mt-8 inline-flex !px-8 !py-3.5">
          Start recognising
        </Link>
      </motion.div>
    </div>
  );
}

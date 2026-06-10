import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ImagePlus,
  Wand2,
  BookOpenCheck,
  Sparkles,
  Shield,
  Zap,
  Languages,
  ArrowRight,
  Camera,
  Upload,
} from "lucide-react";
import Recognizer from "../components/Recognizer";
import { useAuth } from "../context/AuthContext";
import { fetchHealth } from "../api/client";

const features = [
  {
    icon: Zap,
    title: "Instant recognition",
    desc: "Get your Urdu character identified in seconds with a clear, readable result.",
  },
  {
    icon: Languages,
    title: "Built for Urdu script",
    desc: "Trained specifically on Urdu letterforms — not a generic OCR tool.",
  },
  {
    icon: Shield,
    title: "Private history",
    desc: "Sign in to save your results. Your history belongs only to you.",
  },
];

const steps = [
  { icon: ImagePlus, num: "01", title: "Add an image", desc: "Upload, capture, or paste a photo of one Urdu letter." },
  { icon: Wand2, num: "02", title: "We analyse it", desc: "Our AI reads the character and finds the best match." },
  { icon: BookOpenCheck, num: "03", title: "Use the result", desc: "Copy the character or revisit it from your history." },
];

const sampleChars = ["ا", "ب", "پ", "ت", "ج", "ح", "خ", "د", "ر", "س", "ش", "ع", "ف", "ق", "ک", "گ", "ل", "م", "ن", "و", "ہ", "ی"];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(null);

  useEffect(() => {
    fetchHealth().then((h) => setReady(h.ready)).catch(() => setReady(false));
  }, []);

  const scrollToRecognize = () => {
    document.getElementById("recognize")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.07] via-transparent to-transparent" />
        <div className="absolute -right-20 top-10 font-urdu text-[280px] leading-none text-white/[0.02] select-none">
          اردو
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-light shadow-[0_0_8px_#6ee7b7]" : "bg-amber-400"}`} />
                {ready === null ? "Connecting…" : ready ? "System ready" : "Starting up…"}
              </div>

              <h1 className="font-display text-5xl font-semibold leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                Read any
                <span className="mt-2 block bg-gradient-to-r from-gold via-gold-light to-emerald-light bg-clip-text text-transparent">
                  Urdu character
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/50">
                A beautiful, simple way to identify Urdu letters from photos. Perfect for students,
                researchers, and anyone learning the script.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button onClick={scrollToRecognize} className="btn-primary !px-8 !py-3.5 !text-base">
                  <Sparkles size={18} />
                  Try it now
                </button>
                {!isAuthenticated && (
                  <Link to="/signup" className="btn-ghost !px-8 !py-3.5 !text-base">
                    Create free account
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>

              <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/40">
                <span className="flex items-center gap-2"><Upload size={14} /> Upload</span>
                <span className="flex items-center gap-2"><Camera size={14} /> Camera</span>
                <span className="flex items-center gap-2"><ImagePlus size={14} /> Paste</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="glass-strong rounded-3xl p-10 ring-1 ring-gold/20">
                <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-white/35">Sample characters</p>
                <div className="flex flex-wrap justify-center gap-3" dir="rtl">
                  {sampleChars.map((c, i) => (
                    <motion.span
                      key={c}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] font-urdu text-2xl text-white/70 ring-1 ring-white/[0.06] transition hover:bg-gold/10 hover:text-gold hover:ring-gold/30"
                    >
                      {c}
                    </motion.span>
                  ))}
                </div>
                <p className="mt-8 text-center font-urdu text-6xl text-gold/80">ش</p>
                <p className="mt-2 text-center text-sm text-white/35">Recognised with confidence</p>
              </div>
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-emerald/20 blur-3xl" />
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gold/20 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-b border-white/[0.05] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold/80">Why use Urdu OCR</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Simple, accurate, made for you
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8 transition hover:ring-1 hover:ring-gold/20"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-transparent ring-1 ring-gold/25">
                  <f.icon className="text-gold" size={22} />
                </div>
                <h3 className="font-display text-xl text-white">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-b border-white/[0.05] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold/80">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Three easy steps
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                <span className="font-display text-5xl font-light text-white/[0.06]">{s.num}</span>
                <div className="mx-auto -mt-4 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <s.icon className="text-gold" size={24} />
                </div>
                <h3 className="font-display text-xl text-white">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm text-white/45">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECOGNIZER ── */}
      <section id="recognize" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold/80">Try it yourself</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Recognise a character
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/45">
              Upload a clear image with one Urdu letter on a plain background for the best result.
            </p>
          </div>
          <Recognizer />
        </div>
      </section>

      {/* ── CTA ── */}
      {!isAuthenticated && (
        <section className="border-t border-white/[0.05] py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="glass-strong rounded-3xl px-8 py-14 ring-1 ring-gold/15">
              <h2 className="font-display text-3xl font-semibold text-white">Save your recognition history</h2>
              <p className="mx-auto mt-4 max-w-md text-white/45">
                Create a free account to keep a personal log of every character you recognise.
                Sign in fresh each time you open the app.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/signup" className="btn-primary !px-8 !py-3.5">Get started free</Link>
                <Link to="/login" className="btn-ghost !px-8 !py-3.5">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

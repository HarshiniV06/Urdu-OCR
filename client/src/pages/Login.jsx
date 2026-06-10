import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/history";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="mb-8 text-center">
          <span className="font-urdu text-5xl text-gold">خوش آمدید</span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/45">
            Sign in to view your history. You&apos;ll stay signed in until you close the browser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-white/50">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-white/50">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          New here?{" "}
          <Link to="/signup" className="text-gold hover:text-gold-light">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

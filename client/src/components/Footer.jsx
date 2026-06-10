import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-black/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-urdu text-3xl text-gold">اردو OCR</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
              An intelligent Urdu character recognition tool built for students and learners.
              Identify letters from images with clarity and ease.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/35">Navigate</p>
            <ul className="mt-4 space-y-3 text-sm text-white/50">
              <li><Link to="/" className="hover:text-gold">Home</Link></li>
              <li><a href="/#recognize" className="hover:text-gold">Recognise</a></li>
              <li><Link to="/history" className="hover:text-gold">My History</Link></li>
              <li><Link to="/about" className="hover:text-gold">About</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/35">Account</p>
            <ul className="mt-4 space-y-3 text-sm text-white/50">
              <li><Link to="/login" className="hover:text-gold">Sign in</Link></li>
              <li><Link to="/signup" className="hover:text-gold">Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Urdu OCR · Minor Project</p>
          <p className="text-xs text-white/25">Urdu character recognition powered by deep learning</p>
        </div>
      </div>
    </footer>
  );
}

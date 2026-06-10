import { NavLink, Link } from "react-router-dom";
import { ScanText, History, Info, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home", icon: ScanText, end: true },
  { to: "/#recognize", label: "Recognise", icon: ScanText, hash: true },
  { to: "/history", label: "History", icon: History },
  { to: "/about", label: "About", icon: Info },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-emerald/10 ring-1 ring-gold/25 shadow-glow">
            <span className="font-urdu text-2xl text-gold">ا</span>
          </div>
          <div className="hidden sm:block">
            <p className="font-display text-lg font-semibold text-white">Urdu OCR</p>
            <p className="text-xs text-white/40">Character recognition</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end, hash }) =>
            hash ? (
              <a
                key={to}
                href={to}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                <Icon size={16} />
                {label}
              </a>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                    isActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 sm:flex">
                <User size={14} className="text-gold/80" />
                <span className="max-w-[120px] truncate text-xs text-white/70">{user.name}</span>
              </div>
              <button onClick={logout} className="btn-ghost !px-3 !py-2" title="Sign out">
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link to="/signup" className="btn-primary !px-5 !py-2.5 !text-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

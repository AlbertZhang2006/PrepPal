import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Clock,
  MessageCircle,
  HeartHandshake,
  FileText,
  ShieldCheck,
} from "lucide-react";
import DemoBanner from "./DemoBanner";
import PrepPalIcon from "./PrepPalIcon";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/timeline", icon: Clock, label: "Timeline" },
  { to: "/ask", icon: MessageCircle, label: "Ask" },
  { to: "/instructions", icon: FileText, label: "Instructions" },
  { to: "/emergency", icon: HeartHandshake, label: "Help" },
] as const;

export default function Layout() {
  const location = useLocation();
  const hideNav =
    location.pathname === "/" ||
    location.pathname === "/select-procedure" ||
    location.pathname === "/upload" ||
    location.pathname === "/review" ||
    location.pathname === "/setup";

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <DemoBanner />

      <header className="bg-surface border-b border-border px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <PrepPalIcon size={32} />
          <div>
            <h1 className="text-lg font-semibold text-text-primary leading-tight">
              PrepPal
            </h1>
            <span className="text-xs text-text-muted hidden sm:block leading-tight">
              Your Procedure Prep Companion
            </span>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {!hideNav && (
        <nav aria-label="Main navigation" className="bg-surface border-t border-border sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="max-w-2xl mx-auto flex">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-xs transition-colors ${
                    isActive
                      ? "text-brand-600 font-medium"
                      : "text-text-muted hover:text-text-secondary"
                  } ${label === "Help" && !isActive ? "text-warm-500 hover:text-warm-600" : ""}`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <footer className="text-center px-6 py-3 border-t border-border bg-surface">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-xs text-text-muted">
            PrepPal organizes clinic instructions and provides general guidance. Always follow your healthcare team's official instructions.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "History", path: "/history" },
    { label: "Analytics", path: "/analytics" },
    { label: "Profile", path: "/profile" },
    { label: "New Interview", path: "/interview" },
  ];

  const linkClass = (path) => {
  const active = location.pathname === path;

  if (active) {
    return "rounded-lg bg-cyan-400 px-3 py-2 font-semibold text-slate-950";
  }

  return isDark
    ? "rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
    : "rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-cyan-600";
};

  return (
    <nav
      className={`border-b ${
        isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            InterviewForge
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 md:hidden"
          >
            ☰
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={linkClass(link.path)}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {isDark ? "🌙" : "☀️"}
              </span>

              <button
                onClick={toggleTheme}
                className={`relative h-6 w-12 rounded-full transition ${
                  isDark ? "bg-cyan-400" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    isDark ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Logout
            </button>
          </div>
        </div>

        {isOpen && (
         <div
  className={`mt-4 flex flex-col gap-3 border-t pt-4 md:hidden ${
    isDark ? "border-slate-800" : "border-slate-300"
  }`}
>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={linkClass(link.path)}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {isDark ? "🌙" : "☀️"}
              </span>

              <button
                onClick={toggleTheme}
                className={`relative h-6 w-12 rounded-full transition ${
                  isDark ? "bg-cyan-400" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    isDark ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

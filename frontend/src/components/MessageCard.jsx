import { useTheme } from "../context/ThemeContext";

function MessageCard({ type = "error", title, children, className = "" }) {
  const { isDark } = useTheme();

  const styles = {
    error: isDark
      ? "border-red-900 bg-red-950/40 text-red-200"
      : "border-red-300 bg-red-100 text-red-800",
    success: isDark
      ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: isDark
      ? "border-cyan-900 bg-cyan-950/40 text-cyan-200"
      : "border-cyan-200 bg-cyan-50 text-cyan-700",
  };

  return (
    <div
      className={`rounded-xl border p-4 text-sm ${styles[type]} ${className}`}
    >
      {title && <p className="mb-2 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export default MessageCard;

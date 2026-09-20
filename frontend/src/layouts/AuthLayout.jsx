import { useTheme } from "../context/ThemeContext";

function AuthLayout({ title, children }) {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-950"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl ${
          isDark
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <h1 className="mb-6 text-center text-3xl font-bold">
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
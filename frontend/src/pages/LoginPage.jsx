import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MessageCard from "../components/MessageCard";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const inputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
    : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-cyan-400";

  const linkTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      const data = await loginUser(formData);
      login(data);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <AuthLayout title="Welcome Back">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <MessageCard
            type="error"
            title="Something went wrong"
            className="mt-6"
          >
            {error}
          </MessageCard>
        )}

        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          placeholder="Email address"
          className={inputClass}
        />

        <div className="relative">
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={`${inputClass} pr-16`}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-cyan-400"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Login
        </button>

        <p className={`text-center text-sm ${linkTextClass}`}>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-cyan-400">
            Create Account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;

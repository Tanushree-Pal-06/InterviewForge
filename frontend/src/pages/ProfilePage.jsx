import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function ProfilePage() {
  const { user, token, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const cardClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-slate-50";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const dangerClass = isDark
    ? "border-red-900/50 bg-red-950/30"
    : "border-red-200 bg-red-50";

  const modalClass = isDark
    ? "border-slate-800 bg-slate-900 text-white"
    : "border-slate-200 bg-white text-slate-950";

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      logout();
      navigate("/register");
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <p className="text-sm text-cyan-400">Account</p>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>

          <div className={`rounded-2xl border p-6 shadow-lg ${panelClass}`}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-2xl font-bold text-slate-950">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className={`text-sm ${mutedTextClass}`}>{user?.email}</p>
              </div>
            </div>

            {error && (
              <MessageCard type="error" className="mb-5">
                {error}
              </MessageCard>
            )}

            <div className="grid gap-4">
              <div className={`rounded-xl border p-4 ${cardClass}`}>
                <p className={`text-sm ${mutedTextClass}`}>Name</p>
                <p className="mt-1 font-medium">
                  {user?.name || "Not available"}
                </p>
              </div>

              <div className={`rounded-xl border p-4 ${cardClass}`}>
                <p className={`text-sm ${mutedTextClass}`}>Email</p>
                <p className="mt-1 font-medium">
                  {user?.email || "Not available"}
                </p>
              </div>

            </div>

            <div className={`mt-6 rounded-xl border p-4 ${dangerClass}`}>
              <h3
                className={`font-semibold ${
                  isDark ? "text-red-300" : "text-red-700"
                }`}
              >
                Danger Zone
              </h3>

              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                Permanently delete your account, interviews, answers, reports,
                and analytics data.
              </p>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${modalClass}`}>
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-red-300" : "text-red-700"
              }`}
            >
              Delete Account?
            </h2>

            <p className={`mt-3 text-sm ${mutedTextClass}`}>
              This action will permanently delete your account and all interview
              data. This cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className={`rounded-xl border px-4 py-2 ${
                  isDark
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
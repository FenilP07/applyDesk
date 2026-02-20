import { GoogleLogin } from "@react-oauth/google";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const { googleLogin, loading, error, clearError } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 p-6">
        <h1 className="text-xl font-semibold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">Use Google to continue.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Close
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <div className={loading ? "opacity-60 pointer-events-none" : ""} aria-busy={loading}>
            <GoogleLogin
              onSuccess={async (cred) => {
                const result = await googleLogin(cred.credential);
                if (result?.success) navigate("/dashboard", { replace: true });
              }}
              onError={() => {}}
              useOneTap={false}
            />
          </div>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            Signing you in…
          </div>
        )}
      </div>
    </div>
  );
}
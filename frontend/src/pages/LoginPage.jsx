import { GoogleLogin } from "@react-oauth/google";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Sparkles, ShieldCheck, AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { googleLogin, loading, error, clearError } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200 mb-4">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Job<span className="text-blue-600">Radar</span>
          </h1>
          <p className="mt-2 text-gray-500 text-center">
            Your personal command center for job hunting.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage your applications</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button
                onClick={clearError}
                className="shrink-0 rounded-lg p-1 hover:bg-rose-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-6">
            <div 
              className={`w-full transition-all duration-300 ${loading ? "opacity-40 pointer-events-none scale-[0.98]" : "scale-100"}`} 
              aria-busy={loading}
            >
              <GoogleLogin
                onSuccess={async (cred) => {
                  const result = await googleLogin(cred.credential);
                  if (result?.success) navigate("/dashboard", { replace: true });
                }}
                onError={() => {}}
                useOneTap={false}
                theme="outline"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-sm font-medium text-blue-600 animate-pulse">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                Authenticating...
              </div>
            )}
          </div>

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck size={16} />
            <span className="text-xs font-medium uppercase tracking-widest">Secure Cloud Sync</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400 leading-relaxed px-4">
          By signing in, you agree to our Terms of Service. <br />
          Your data is encrypted and never shared with employers.
        </p>
      </div>
    </div>
  );
}
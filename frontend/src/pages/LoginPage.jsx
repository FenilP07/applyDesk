import { GoogleLogin } from "@react-oauth/google";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { googleLogin, loading, error, clearError } = useAuthStore();

  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F5F2" }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      {/* Soft background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-stone-200/50 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo mark + wordmark */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-11 h-11 rounded-[11px] flex items-center justify-center mb-4"
            style={{ background: "#1C1917" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h1
            className="text-[1.6rem] text-stone-900 tracking-tight"
            style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.03em" }}
          >
            applyDesk
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Your job search, organised.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8"
          style={{ border: "1px solid #E8E4DE", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="mb-6">
            <h2
              className="text-lg text-stone-900 mb-1"
              style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              Welcome back
            </h2>
            <p className="text-xs text-stone-400">Sign in to manage your applications</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 rounded-xl p-3.5 text-xs flex items-start gap-2.5"
              style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
              <button
                onClick={clearError}
                className="shrink-0 hover:opacity-60 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Google login */}
          <div className={`w-full transition-all duration-200 ${loading ? "opacity-40 pointer-events-none" : ""}`}>
            <GoogleLogin
              onSuccess={async (cred) => {
                const result = await googleLogin(cred.credential);
                if (result?.success) navigate("/dashboard", { replace: true });
              }}
              onError={() => {}}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-stone-400">
              <div
                className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                style={{ borderColor: "#E8E4DE", borderTopColor: "#1C1917" }}
              />
              Authenticating…
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#EFEDE9]" />
            <span className="text-[0.6rem] text-stone-300 uppercase tracking-widest font-semibold">
              secure
            </span>
            <div className="flex-1 h-px bg-[#EFEDE9]" />
          </div>

          <p className="text-xs text-center leading-relaxed text-[#A8A29E]">
            Your data is encrypted and never shared with employers.
          </p>
        </div>

        <p className="text-center text-xs mt-6 text-[#C4BDB5]">
          By signing in you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
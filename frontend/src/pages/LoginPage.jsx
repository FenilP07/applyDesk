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
      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-stone-200/40 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
            style={{ background: "#1C1917" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1
            className="text-2xl tracking-tight text-stone-900"
            style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.03em" }}
          >
            JobRadar
          </h1>
          <p className="text-sm text-stone-400 mt-1 font-normal">
            Your job search, organised.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8"
          style={{ border: "1px solid #E8E4DE" }}
        >
          <div className="mb-7">
            <h2
              className="text-lg text-stone-900 mb-1"
              style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              Welcome back
            </h2>
            <p className="text-xs text-stone-400 font-normal">Sign in to manage your applications</p>
          </div>

          {error && (
            <div
              className="mb-5 rounded-xl p-3.5 text-xs flex items-start gap-2.5"
              style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C" }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
              <button onClick={clearError} className="shrink-0 hover:opacity-70 transition-opacity">
                <X size={13} />
              </button>
            </div>
          )}

          <div
            className={`w-full transition-all duration-200 ${
              loading ? "opacity-40 pointer-events-none" : ""
            }`}
          >
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

          {loading && (
            <div className="flex items-center justify-center gap-2.5 mt-4 text-xs font-medium text-stone-400">
              <div
                className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                style={{ borderColor: "#E8E4DE", borderTopColor: "#1C1917" }}
              />
              Authenticating…
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "#E8E4DE" }} />
            <span className="text-xs text-stone-300 uppercase tracking-widest font-medium">secure</span>
            <div className="flex-1 h-px" style={{ background: "#E8E4DE" }} />
          </div>

          <p className="text-xs text-center leading-relaxed" style={{ color: "#A8A29E" }}>
            Your data is encrypted and never shared with employers.
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#A8A29E" }}>
          By signing in you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
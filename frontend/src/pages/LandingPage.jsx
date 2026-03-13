import { ArrowRight, LayoutDashboard, BarChart3, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F7F5F2] text-stone-800 font-['DM_Sans'] flex flex-col">
      {/* NAVBAR */}
      <nav className="border-b border-[#E8E4DE] bg-[#F7F5F2]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1C1917] text-white rounded-lg flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="font-semibold text-stone-900 text-lg font-['Lora']">
              ApplyDesk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigate("login");
              }}
              className="px-4 py-2 rounded-lg border border-[#E8E4DE] bg-white text-sm"
            >
              Log In
            </button>

            {/* <button className="px-4 py-2 rounded-lg bg-[#1C1917] text-white text-sm">
              Sign Up
            </button> */}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* TEXT */}
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold font-['Lora'] text-stone-900 leading-tight">
              Track your job search
              <br />
              without the chaos.
            </h1>

            <p className="mt-5 text-stone-500 max-w-lg">
              ApplyDesk helps you organize applications, track interviews, and
              manage your career pipeline in one calm dashboard.
            </p>

            <button
              onClick={() => {
                navigate("login");
              }}
              className="mt-8 px-6 py-3 rounded-xl bg-[#1C1917] text-white flex items-center gap-2 text-sm font-medium hover:bg-black transition"
            >
              Start Tracking
              <ArrowRight size={16} />
            </button>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="bg-white border border-[#E8E4DE] rounded-2xl shadow-sm p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-700">
                  Applications
                </span>
                <span className="text-xs text-stone-400">32 total</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Frontend Developer</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    Applied
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Software Engineer</span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    Interview
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Fullstack Dev</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Offer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FEATURES */}
      <section className="border-t border-[#E8E4DE] py-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          <Feature
            icon={<LayoutDashboard size={20} />}
            title="Application Pipeline"
            text="See every application in one organized view."
          />

          <Feature
            icon={<Clock size={20} />}
            title="Interview Tracking"
            text="Keep track of interview stages and deadlines."
          />

          <Feature
            icon={<BarChart3 size={20} />}
            title="Insights"
            text="Understand which applications convert to interviews."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E8E4DE] py-6 text-center text-sm text-stone-400">
        © 2026 ApplyDesk
      </footer>
    </div>
  );
};

function Feature({ icon, title, text }) {
  return (
    <div className="bg-white border border-[#E8E4DE] rounded-xl p-5 flex gap-3">
      <div className="text-stone-700">{icon}</div>
      <div>
        <h3 className="font-medium text-stone-900 text-sm">{title}</h3>
        <p className="text-xs text-stone-500 mt-1">{text}</p>
      </div>
    </div>
  );
}

export default LandingPage;

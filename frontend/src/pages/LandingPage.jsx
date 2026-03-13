import { ArrowRight, LayoutDashboard, BarChart3, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-[#F7F5F2] text-stone-800 font-['DM_Sans'] flex flex-col overflow-hidden">
      {/* NAVBAR */}
      <nav className="border-b border-[#E8E4DE] bg-[#F7F5F2]/95 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1C1917] text-white rounded-lg flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="font-semibold text-stone-900 text-base tracking-tight font-['Lora']">
              ApplyDesk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:block">
              Free to get started
            </span>
            <button
              onClick={() => navigate("login")}
              className="px-4 py-2 rounded-lg border border-[#E8E4DE] bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-all"
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 flex items-center min-h-0 py-2">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-10 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200 mb-4">
                <span>🚀</span>
                <span>Now in Public Beta</span>
              </div>

              <h1 className="text-[2.15rem] md:text-[2.55rem] lg:text-[2.75rem] font-semibold font-['Lora'] text-stone-900 leading-[1.04] tracking-tight">
                Track your job search
                <br />
                without the chaos.
              </h1>

              <p className="mt-3 text-[14px] leading-6 text-stone-500 max-w-[36rem]">
                Organize applications, track every interview stage, and keep your
                pipeline clear in one focused dashboard.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => navigate("login")}
                  className="px-5 py-2.5 rounded-lg bg-[#1C1917] text-white inline-flex items-center gap-2 text-sm font-medium hover:bg-black transition-all shadow-sm"
                >
                  Start Tracking
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#EAE6E1] pt-5">
                <FeatureRow
                  icon={<LayoutDashboard size={13} />}
                  title="Application Pipeline"
                  text="Every application, status, and stage in one view."
                />
                <FeatureRow
                  icon={<Clock size={13} />}
                  title="Interview Tracking"
                  text="Deadlines, next steps, and notes stay organized."
                />
                <FeatureRow
                  icon={<BarChart3 size={13} />}
                  title="Search Insights"
                  text="See what’s working across your pipeline."
                />
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="bg-white border border-[#E8E4DE] rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE6]">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Applications
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Your current pipeline
                    </p>
                  </div>
                  <span className="text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                    32 total
                  </span>
                </div>

                <div className="pt-3.5 space-y-2">
                  <PreviewRow
                    role="Frontend Developer"
                    company="Shopify"
                    status="Applied"
                    statusClass="bg-blue-50 text-blue-700"
                  />
                  <PreviewRow
                    role="Software Engineer"
                    company="Wealthsimple"
                    status="Interview"
                    statusClass="bg-yellow-50 text-yellow-700"
                  />
                  <PreviewRow
                    role="Fullstack Developer"
                    company="Carta"
                    status="Offer"
                    statusClass="bg-green-50 text-green-700"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <MiniStat label="Applied" value="18" />
                  <MiniStat label="Interviews" value="9" />
                  <MiniStat label="Offers" value="2" />
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#F0ECE6]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-stone-400">
                      Interview rate
                    </span>
                    <span className="text-[11px] font-semibold text-stone-700">
                      50%
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-stone-800 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E8E4DE] py-3 text-center text-[11px] text-stone-400 flex-shrink-0">
        © 2026 ApplyDesk
      </footer>
    </div>
  );
};

function FeatureRow({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="leading-5">
        <span className="text-xs font-semibold text-stone-800">{title}</span>
        <span className="text-xs text-stone-400 ml-1.5">{text}</span>
      </div>
    </div>
  );
}

function PreviewRow({ role, company, status, statusClass }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#F1ECE6] bg-[#FCFBF9] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-800 truncate">{role}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">{company}</p>
      </div>
      <span
        className={`shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusClass}`}
      >
        {status}
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#FAF8F5] border border-[#EFE9E1] px-3 py-2.5">
      <p className="text-[10px] text-stone-400">{label}</p>
      <p className="text-base font-semibold text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}

export default LandingPage;
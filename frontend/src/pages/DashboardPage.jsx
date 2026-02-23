import React, { useEffect, useMemo } from "react";
import useJobStore from "../store/jobStore";
import { 
  PieChart, 
  Pie, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Legend 
} from "recharts";
import { 
  Briefcase, 
  Send, 
  Users, 
  Trophy, 
  XCircle, 
  Plus 
} from "lucide-react";

// 1. Color Palette Mapping
const STATUS_COLORS = {
  applied: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", chart: "#3b82f6", icon: Send },
  interview: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", chart: "#8b5cf6", icon: Users },
  offer: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", chart: "#10b981", icon: Trophy },
  rejected: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100", chart: "#6b7280", icon: XCircle },
  total: { bg: "bg-slate-50", text: "text-slate-900", border: "border-slate-200", chart: "#1f2937", icon: Briefcase },
};

const StatCard = ({ title, value, type }) => {
  const config = STATUS_COLORS[type] || STATUS_COLORS.total;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.border} bg-white p-5 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className={`rounded-lg ${config.bg} p-2 ${config.text}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</span>
      </div>
      <div className={`mt-4 text-3xl font-bold tracking-tight ${config.text}`}>
        {value ?? 0}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { summary, fetchSummary, fetchJobs } = useJobStore();

  useEffect(() => {
    fetchSummary();
    fetchJobs();
  }, [fetchSummary, fetchJobs]);

  const byStatus = summary?.byStatus ?? {};
  const total = summary?.total ?? 0;

  const chartData = useMemo(() => {
    return [
      { name: "Applied", value: byStatus.applied ?? 0, color: STATUS_COLORS.applied.chart },
      { name: "Interview", value: byStatus.interview ?? 0, color: STATUS_COLORS.interview.chart },
      { name: "Offer", value: byStatus.offer ?? 0, color: STATUS_COLORS.offer.chart },
      { name: "Rejected", value: byStatus.rejected ?? 0, color: STATUS_COLORS.rejected.chart },
    ].filter((x) => x.value > 0);
  }, [byStatus]);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-8 bg-gray-50/50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Job Radar</h1>
          <p className="mt-1 text-gray-500">Overview of your current application pipeline.</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          <Plus size={18} />
          Add Application
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={total} type="total" />
        <StatCard title="Applied" value={byStatus.applied} type="applied" />
        <StatCard title="Interviews" value={byStatus.interview} type="interview" />
        <StatCard title="Offers" value={byStatus.offer} type="offer" />
        <StatCard title="Rejected" value={byStatus.rejected} type="rejected" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart Card */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Success Funnel</h3>
            <span className="text-xs font-medium text-gray-400">Live Distribution</span>
          </div>
          
          <div className="h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 p-8 text-center">
                <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                  <Briefcase className="text-gray-300" size={32} />
                </div>
                <p className="max-w-[200px] text-sm text-gray-500 italic">
                  No data yet. Save a job from LinkedIn to see your funnel grow.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-medium text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sidebar Info/Tips */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-200">
            <h4 className="text-lg font-bold">Pro Tip</h4>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Applications sent on **Tuesdays** have a 20% higher response rate than those sent on Fridays.
            </p>
            <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-blue-400/30">
              <div className="h-full bg-white transition-all" style={{ width: '65%' }}></div>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-blue-100/70">Search Progress: 65%</p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h4 className="font-bold text-gray-900">Conversion Rate</h4>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {total > 0 ? ((byStatus.interview / total) * 100).toFixed(1) : 0}%
              </span>
              <span className="mb-1 text-sm font-medium text-gray-500 text-nowrap">Apply → Interview</span>
            </div>
            <p className="mt-3 text-xs text-gray-400">Based on your total applications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
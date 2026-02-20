import { useEffect, useMemo } from "react";
import useJobStore from "../store/jobStore";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

const StatCard = ({ title, value, subtitle }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
      </div>
    </div>

    <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
      {value ?? 0}
    </div>
  </div>
);

const Section = ({ title, description, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {description && <div className="mt-1 text-sm text-gray-500">{description}</div>}
    </div>
    {children}
  </div>
);

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
      { name: "Applied", value: byStatus.applied ?? 0 },
      { name: "Interview", value: byStatus.interview ?? 0 },
      { name: "Offer", value: byStatus.offer ?? 0 },
      { name: "Rejected", value: byStatus.rejected ?? 0 },
    ].filter((x) => x.value > 0);
  }, [byStatus]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Your job search at a glance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={total} />
        <StatCard title="Applied" value={byStatus.applied} />
        <StatCard title="Interview" value={byStatus.interview} />
        <StatCard title="Offer" value={byStatus.offer} />
        <StatCard title="Rejected" value={byStatus.rejected} />
      </div>

      {/* Chart */}
      <div className="mt-6">
        <Section
          title="Status Breakdown"
          description={
            chartData.length === 0
              ? "No data yet — add your first job application."
              : "Distribution of applications by status."
          }
        >
          {chartData.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              Tip: save a job from LinkedIn using your extension and you’ll see this fill up.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
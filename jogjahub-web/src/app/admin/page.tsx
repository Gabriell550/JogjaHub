import { Card } from "@/src/components/ui/Card";

const adminStats = [
  { label: "Total users", value: "420" },
  { label: "Verified vendors", value: "32" },
  { label: "Bookings", value: "102" },
  { label: "Pending checks", value: "7" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Platform operations</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Manage user approvals and account status.</li>
          <li>Review vendor onboarding requests.</li>
          <li>Monitor active bookings and exceptions.</li>
          <li>Track platform-level performance and moderation tasks.</li>
        </ul>
      </Card>
    </div>
  );
}

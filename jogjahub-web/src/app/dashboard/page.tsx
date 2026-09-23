import { Card } from "@/src/components/ui/Card";

const stats = [
  { label: "Total bookings", value: "24" },
  { label: "Active vendors", value: "18" },
  { label: "Pending reviews", value: "6" },
  { label: "Revenue", value: "Rp 18.5M" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Overview</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>New service request from a customer.</li>
            <li>Vendor profile updated successfully.</li>
            <li>Booking scheduled for next week.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Quick notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Review and approve vendor onboarding.</li>
            <li>Check outstanding payment confirmation.</li>
            <li>Monitor calendar availability for upcoming days.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

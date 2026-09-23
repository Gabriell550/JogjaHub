import { Card } from "@/src/components/ui/Card";

const vendorOverview = [
  { label: "Services", value: "12" },
  { label: "Orders", value: "8" },
  { label: "Calendar", value: "Available" },
  { label: "Profile", value: "80%" },
];

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Vendor</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Vendor dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {vendorOverview.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Vendor workflow</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>Manage service catalog and pricing.</li>
          <li>Track customer orders and booking status.</li>
          <li>View personal calendar and availability.</li>
          <li>Update storefront profile and contact settings.</li>
        </ul>
      </Card>
    </div>
  );
}

import { Card } from "@/src/components/ui/Card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Users</h1>
      </div>
      <Card className="p-6">
        <p className="text-slate-600">This page is reserved for admin user list and moderation management.</p>
      </Card>
    </div>
  );
}

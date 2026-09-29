import { AdminSidebar } from "@/src/features/admin/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:ml-56 lg:p-10">{children}</main>
    </div>
  );
}
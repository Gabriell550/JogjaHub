"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/src/features/admin/components/AdminSidebar";
import { useAuth } from "@/src/hooks/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session?.user.role !== "admin") {
      router.replace("/admin-login");
    }
  }, [isLoading, session, router]);

  if (isLoading || session?.user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:ml-56 lg:p-10">{children}</main>
    </div>
  );
}
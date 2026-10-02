"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/src/features/admin/components/AdminSidebar";
import { useAuth } from "@/src/hooks/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && session?.user.role !== "admin") {
      router.replace("/admin-login");
    }
  }, [isHydrated, session, router]);

  if (!isHydrated || session?.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FF]">
        <p role="status" className="text-sm text-[#5A4136]">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:ml-56 lg:p-10">{children}</main>
    </div>
  );
}
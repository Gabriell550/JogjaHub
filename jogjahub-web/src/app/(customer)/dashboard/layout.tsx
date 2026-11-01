"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomerDashboardShell } from "@/src/components/customer/CustomerDashboardShell";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (session?.user.role === "tenant") {
      router.replace(ROUTES.vendor);
    } else if (session?.user.role === "admin") {
      router.replace(ROUTES.admin);
    } else if (!session) {
      router.replace(`${ROUTES.login}?role=customer`);
    }
  }, [isHydrated, router, session]);

  return <CustomerDashboardShell>{children}</CustomerDashboardShell>;
}

import { createContext, useContext } from "react";
import type { TenantStatus } from "@/src/features/auth/types";
import type { TenantAddress } from "@/src/types/address";

export interface PortalProfile {
  business_name: string;
  description?: string | null;
  status: TenantStatus;
  address: TenantAddress | string | null;
  location?: { latitude: number | string; longitude: number | string } | null;
  whatsapp_number?: string | null;
  rejection_reason?: string | null;
  categories?: { id: number; name: string }[];
}

export const approvalLabel: Record<TenantStatus, string> = {
  approved: "Disetujui",
  pending: "Menunggu persetujuan",
  rejected: "Ditolak",
};

export const PortalProfileContext = createContext<{ profile: PortalProfile; updateProfile: (profile: PortalProfile) => void } | null>(null);

export function usePortalProfile() {
  const context = useContext(PortalProfileContext);
  if (!context) throw new Error("Profil tenant belum tersedia.");
  return context;
}

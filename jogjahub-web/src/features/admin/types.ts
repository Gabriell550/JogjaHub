export interface DashboardSummary {
  customers_total: number;
  tenants_total: number;
  tenants_pending: number;
  tenants_approved: number;
  bookings_today: number;
  bookings_pending: number;
  bookings_confirmed: number;
  bookings_cancelled: number;
}

export interface PendingTenant {
  id: number;
  /** Route key publik tenant — semua aksi admin (approve/reject) memakai uuid ini. */
  uuid: string;
  business_name: string;
  address: string | null;
  ktp_url: string | null;
  nib_url: string | null;
  portfolio_url: string | null;
  categories: { id: number; name: string }[];
  user: { name: string; email: string; phone: string | null };
}

export interface AdminBooking {
  id: number;
  status: "pending" | "confirmed" | "cancelled" | string;
  created_at: string;
  service?: { name: string; tenant?: { business_name: string } };
  customer?: { name: string; email: string };
}

/**
 * Envelope umum untuk response endpoint admin yang mengembalikan daftar.
 * Backend memakai JSON Resource Collection (bisa berupa array datar maupun
 * bungkus paginator `{ data: [...] }` tergantung bentuk render resource),
 * jadi frontend mendukung keduanya lewat bantuan `unwrapList`.
 */
export interface AdminListResponse<T> {
  success: boolean;
  data: T[] | { data: T[] };
}

export type DisputeStatus = "open" | "resolved";

export interface DisputeMessage {
  id: number;
  dispute_id: number;
  sender_name: string;
  sender_role: "customer" | "tenant" | "admin";
  message: string;
  created_at: string;
}

export interface Dispute {
  uuid: string;
  subject: string;
  opener_name: string;
  opener_role: "customer" | "tenant";
  status: DisputeStatus;
  created_at: string;
  messages: DisputeMessage[];
}

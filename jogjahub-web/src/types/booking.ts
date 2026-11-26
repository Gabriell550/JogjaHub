import type { Service, TimeSlot } from "@/src/types/service";

export type BookingStatus = "pending" | "confirmed" | "awaiting_completion_confirmation" | "completed" | "cancelled";
export type FundStatus = "held" | "processing" | "simulated" | "failed";

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  status: BookingStatus;
  bookingDate: string;
}

export interface BookingResource {
  id: number;
  uuid: string;
  status: BookingStatus;
  created_at: string;
  total_amount?: number | string | null;
  details?: Record<string, unknown> | null;
  service?: Service | null;
  slot?: TimeSlot | null;
  customer?: { name: string; email: string; phone?: string | null } | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  nights?: number | null;
  can_mark_fulfilled?: boolean;
  demo_pickup?: boolean;
  completion_issue?: string | null;
  issue_reported_at?: string | null;
  issue_resolved_at?: string | null;
  issue_resolution?: string | null;
  payment?: {
    status?: string | null;
    fund_status?: FundStatus | null;
    payout_destination?: string | null;
    payout_waiting_for_destination?: boolean;
  } | null;
}

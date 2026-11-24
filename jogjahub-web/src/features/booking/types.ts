import type { BookingStatus } from "@/src/types/booking";

export interface BookingRecord {
  id: string;
  customerName: string;
  vendorName: string;
  serviceName: string;
  status: BookingStatus;
  date: string;
}

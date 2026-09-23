export interface BookingRecord {
  id: string;
  customerName: string;
  vendorName: string;
  serviceName: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  date: string;
}

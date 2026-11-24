export type BookingStatus = "pending" | "confirmed" | "awaiting_completion_confirmation" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  status: BookingStatus;
  bookingDate: string;
}

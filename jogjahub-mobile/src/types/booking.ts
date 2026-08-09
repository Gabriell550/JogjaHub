export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  serviceId: string;
  customerId: string;
  vendorId: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
}

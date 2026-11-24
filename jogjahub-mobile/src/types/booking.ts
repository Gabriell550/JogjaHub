import type { BookingRecord } from './bookingRecord';

export type BookingStatus = BookingRecord['status'];

export interface Booking {
  id: string;
  serviceId: string;
  customerId: string;
  vendorId: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
}

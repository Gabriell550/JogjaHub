import { apiClient } from './client';
import type { BookingRecord } from '../types/bookingRecord';

export const demoModeLabel = 'Mode demo · Pembayaran dan pencairan disimulasikan';

export const demoPaymentMethods = [
  { value: 'bank_transfer', label: 'Transfer bank' },
  { value: 'gopay', label: 'GoPay' },
  { value: 'dana', label: 'DANA' },
] as const;

export type DemoPaymentMethod = (typeof demoPaymentMethods)[number]['value'];

export type DemoDestination = {
  type: 'bank' | 'gopay' | 'dana';
  provider: string;
  number: string;
  holder: string;
};

export type EscrowPage = { data: BookingRecord[]; meta: { current_page: number; last_page: number } };

export const demoEscrowApi = {
  earnings: (page: number) => apiClient.get<EscrowPage>('/tenant/demo-earnings', { params: { page } }),
  destination: () => apiClient.get<{ data: DemoDestination | null }>('/tenant/demo-payout-destination'),
  saveDestination: (destination: DemoDestination) => apiClient.put<{ data: DemoDestination }>('/tenant/demo-payout-destination', destination),
  cases: (page: number) => apiClient.get<EscrowPage>('/admin/demo-escrow-cases', { params: { page } }),
  resolve: (uuid: string, resolution: string) => apiClient.post<{ data: BookingRecord }>(
    `/admin/bookings/${uuid}/resolve-completion-issue`, { resolution },
  ),
  retry: (uuid: string) => apiClient.post<{ data: BookingRecord }>(`/admin/bookings/${uuid}/retry-demo-payout`),
};

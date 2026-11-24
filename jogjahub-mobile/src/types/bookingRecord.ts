export interface BookingRecord {
  id: number;
  uuid: string;
  status: 'pending' | 'confirmed' | 'awaiting_completion_confirmation' | 'completed' | 'cancelled';
  fulfilled_at?: string | null;
  completed_at?: string | null;
  issue_reported_at?: string | null;
  completion_issue?: string | null;
  completion_reminded_at?: string | null;
  completion_conversation_id?: number | null;
  can_mark_fulfilled?: boolean;
  whatsapp_url?: string;
  created_at?: string;
  check_in_date?: string;
  check_out_date?: string;
  nights?: number;
  total_amount?: number | string;
  service?: {
    id: number;
    name: string;
    price?: number | string;
    subcategory?: { name: string };
    tenant?: { uuid?: string; business_name: string; logo_url?: string; address?: { city?: string } };
  };
  customer?: { name: string; avatar_url?: string };
  slot?: { slot_date: string; start_time: string };
  review?: { rating: number; comment?: string };
  payment?: { status?: string; payment_url?: string; expires_at?: string; paid_at?: string };
}

export const bookingStatusLabel: Record<BookingRecord['status'], string> = {
  pending: 'Perlu diproses',
  confirmed: 'Dikonfirmasi',
  awaiting_completion_confirmation: 'Menunggu konfirmasi selesai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export function bookingLabel(booking: BookingRecord) {
  return 'JH-' + String(booking.id).padStart(4, '0');
}

export function paymentLabel(booking: BookingRecord) {
  if (booking.payment?.status === 'paid') return 'Lunas';
  if (booking.payment?.status === 'expired') return 'Pembayaran kedaluwarsa';
  if (booking.status === 'cancelled') return 'Pesanan dibatalkan';
  if (booking.whatsapp_url) return 'Transaksi via WhatsApp';
  if (booking.payment?.status === 'pending') return 'Menunggu pembayaran';
  return 'Status pembayaran belum tersedia';
}

import type { Dispute } from "@/src/features/admin/types";

// DATA DUMMY — ganti isi file ini dengan pemanggilan API asli begitu backend sengketa sudah jadi.
// Bentuk data di sini sengaja dibuat SAMA PERSIS seperti kontrak yang direncanakan untuk endpoint
// GET /admin/disputes dan GET /admin/disputes/{uuid}, supaya nanti tinggal ganti sumber datanya.
export const disputeMocks: Dispute[] = [
  {
    uuid: "dummy-1",
    subject: "Pembayaran belum dikonfirmasi tenant",
    opener_name: "Siti Rahma",
    opener_role: "customer",
    status: "open",
    created_at: "2026-10-01T09:12:00Z",
    messages: [
      { id: 1, dispute_id: 1, sender_name: "Siti Rahma", sender_role: "customer", message: "Halo min, saya sudah transfer tapi status booking masih pending 2 hari.", created_at: "2026-10-01T09:12:00Z" },
      { id: 2, dispute_id: 1, sender_name: "Admin", sender_role: "admin", message: "Halo kak, akan saya cek ke tenant-nya ya, mohon tunggu sebentar.", created_at: "2026-10-01T09:40:00Z" },
    ],
  },
  {
    uuid: "dummy-2",
    subject: "Customer membatalkan mendadak",
    opener_name: "Salon Kenanga",
    opener_role: "tenant",
    status: "resolved",
    created_at: "2026-09-28T14:05:00Z",
    messages: [
      { id: 3, dispute_id: 2, sender_name: "Salon Kenanga", sender_role: "tenant", message: "Customer batalin H-1 tanpa kabar, slot udah kami siapin.", created_at: "2026-09-28T14:05:00Z" },
      { id: 4, dispute_id: 2, sender_name: "Admin", sender_role: "admin", message: "Sudah kami tindak lanjuti, terima kasih laporannya.", created_at: "2026-09-29T08:00:00Z" },
    ],
  },
];
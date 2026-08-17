import { apiClient } from '../api/client';

export type NotificationType = 'booking' | 'approval' | 'reminder';

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
};

type Role = 'customer' | 'tenant' | 'admin';

// Role menentukan endpoint mana yang dipanggil, karena routes backend
// di-scope per role (customer/tenant/admin), bukan satu endpoint umum.
export async function getNotifications(role: Role) {
  const res = await apiClient.get<{ data: NotificationItem[] }>(`/${role}/notifications`);
  return res.data.data;
}

export async function markNotificationAsRead(role: Role, id: number) {
  await apiClient.patch(`/${role}/notifications/${id}/read`);
}

// Wrapper push notification (mis. Firebase Cloud Messaging) untuk notifikasi booking masuk,
// approval vendor, dll. Diisi saat integrasi FCM dilakukan.
import { create } from 'zustand';
import { getNotifications, markNotificationAsRead, NotificationItem } from '@services/notificationService';
type Role = 'customer' | 'tenant' | 'admin';

type NotificationState = {
  items: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: (role: Role) => Promise<void>;
  markRead: (role: Role, id: number) => Promise<void>;
  markAllRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchNotifications: async (role) => {
    set({ isLoading: true });
    try {
      const data = await getNotifications(role);
      set({ items: data });
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (role, id) => {
    // update optimis dulu biar UI responsif, baru panggil API
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
    await markNotificationAsRead(role, id);
  },

  markAllRead: () => {
    set((state) => ({ items: state.items.map((n) => ({ ...n, is_read: true })) }));
  },
}));
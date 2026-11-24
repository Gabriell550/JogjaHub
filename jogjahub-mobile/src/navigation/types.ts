import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  RegisterCustomer: undefined;
  // `mode: 'resubmit'` = form registrasi awal dipakai untuk pengajuan ulang
  // tenant berstatus rejected (issue #59) — data lama terisi otomatis.
  RegisterVendor: { mode?: 'resubmit' } | undefined;
  PendingApproval: { businessName?: string; rejected?: boolean };
  VendorOnboarding: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Catalog: { categoryId: string };
  MyBookings: undefined;
  Profile: undefined;
};

export type VendorTabParamList = {
  Dashboard: undefined;
  // Sama seperti Orders — Listing juga sebenarnya sebuah stack (VendorServicesStackNavigator),
  // butuh tipe nested supaya bisa navigate langsung ke ServiceForm dari luar (mis. dashboard).
  Listing: NavigatorScreenParams<VendorServicesStackParamList> | undefined;
  Calendar: undefined;
  // Sebelumnya `undefined` — diubah jadi NavigatorScreenParams supaya TypeScript tahu tab
  // "Orders" itu sebenarnya nge-render sebuah stack (VendorOrdersStackNavigator) yang punya
  // layar sendiri di dalamnya (OrdersList, OrderDetail), bukan satu layar tunggal.
  Orders: NavigatorScreenParams<VendorOrdersStackParamList> | undefined;
  Profile: undefined;
};

// Stack kecil di dalam tab Profile — supaya bisa lompat ke form "Lengkapi Profil Bisnis"
// tanpa keluar dari tab Profile itu sendiri.
export type VendorProfileStackParamList = {
  ProfileHome: undefined;
  EditBusinessProfile: undefined;
  VendorChatInbox: undefined;
  VendorChatRoom: {
    conversationId: string;
    customerName: string;
    customerAvatar?: string;
    serviceName?: string;
    servicePrice?: number;
    bookingTime?: string;
    bookingCode?: string;
    unreadCount?: number;
  };
};

export type AdminStackParamList = {
  Dashboard: undefined;
  PendingVendors: undefined;
  Monitoring: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  Notifications: undefined;
  CustomerChats: undefined;
  CustomerChatRoom: { id: number; name: string };
  HotelBooking: undefined;
  Catalog: { categoryId?: number; title?: string; query?: string };
  VendorDetail: {
    tenantUuid: string;
    businessName?: string;
    imageUrl?: string;
  };
  Booking: { serviceId: number | string };
  BookingConfirmation: {
    serviceId: number | string;
    serviceName: string;
    vendorName: string;
    date?: string;
    timeSlot?: string;
    price: number;
    slotId?: number;
    checkInDate?: string;
    checkOutDate?: string;
  };
  // Tambahkan baris ini:
  EditCustomerProfile: undefined;
};

export type VendorDashboardStackParamList = {
  DashboardHome: undefined;
  RecentActivity: undefined;
  Statistics: undefined;
};

export type VendorOrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { id: string };
};

// Bentuk data layanan yang dipakai bareng oleh ServiceForm (edit) & ServiceDetail,
// supaya nggak duplikat definisi di dua tempat.
export type ServiceParam = {
  id: number;
  name: string;
  price: number;
  price_type?: 'per_session' | 'per_night';
  is_active?: boolean;
  description?: string;
  photos?: { url: string; is_primary: boolean; sort_order: number }[];
  subcategory?: { id: number; name: string; category?: { id: number; name: string } };
  bookings_count?: number;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
};

// Stack kecil di dalam tab Listing — ServicesList (daftar layanan), ServiceForm (tambah/edit),
// ServiceDetail (lihat deskripsi & galeri foto), ServiceOrders (pesanan per layanan),
// ServiceReviews (ulasan per layanan).
export type VendorServicesStackParamList = {
  ServicesList: undefined;
  ServiceForm:
    | { mode: 'create' }
    | {
        mode: 'edit';
        service: ServiceParam;
      };
  ServiceDetail: { service: ServiceParam };
  ServiceOrders: { serviceId: number; serviceName: string };
  ServiceReviews: { serviceId: number; serviceName: string };
};


import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  RegisterCustomer: undefined;
  RegisterVendor: undefined;
  PendingApproval: { businessName?: string; rejected?: boolean };
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
};

export type AdminStackParamList = {
  Dashboard: undefined;
  PendingVendors: undefined;
  Monitoring: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  Notifications: undefined;
};

export type VendorDashboardStackParamList = {
  DashboardHome: undefined;
  RecentActivity: undefined;
  Statistics: undefined;
};

export type VendorOrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: {
    id: string;
    order_code: string;
    service_name: string;
    customer_name: string;
    customer_location: string;
    price: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    photo_url?: string;
  };
};

// Bentuk data layanan yang dipakai bareng oleh ServiceForm (edit) & ServiceDetail,
// supaya nggak duplikat definisi di dua tempat.
export type ServiceParam = {
  id: number;
  name: string;
  price: number;
  description?: string;
  photos?: { url: string; is_primary: boolean; sort_order: number }[];
  subcategory?: { id: number; name: string; category?: { id: number; name: string } };
  confirmed_bookings_count?: number;
  reviews_average_rating?: number | null;
  reviews_counts?: number;
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
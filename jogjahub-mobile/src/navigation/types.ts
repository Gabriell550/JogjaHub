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
  Listing: undefined;
  Calendar: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Stack kecil di dalam tab Profile — supaya bisa lompat ke form "Lengkapi Profil Bisnis"
// tanpa keluar dari tab Profile itu sendiri.
export type VendorProfileStackParamList = {
  ProfileHome: undefined;
  EditBusinessProfile: undefined;
};

// Stack kecil di dalam tab Listing — ServicesList (daftar layanan) & ServiceForm (tambah/edit).
export type VendorServicesStackParamList = {
  ServicesList: undefined;
  ServiceForm: { mode: 'create' } | { mode: 'edit'; serviceId: number };
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

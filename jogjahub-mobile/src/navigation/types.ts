export type AuthStackParamList = {
  Login: undefined;
  RegisterCustomer: undefined;
  RegisterVendor: undefined;
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

export type AdminStackParamList = {
  Dashboard: undefined;
  PendingVendors: undefined;
  Monitoring: undefined;
  Profile: undefined;
};

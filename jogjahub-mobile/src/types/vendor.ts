export interface VendorProfile {
  id: string;
  businessName: string;
  categories: string[]; // bisa lebih dari satu, mis. ['salon_mua', 'butik_wisuda']
  address: string;
  phone: string;
  idCardUrl: string;         // KTP
  businessLicenseUrl: string; // Surat Izin / Badan Usaha
  status: 'pending' | 'approved' | 'rejected';
  latitude: number;
  longitude: number;
  whatsappNumber: string;
}

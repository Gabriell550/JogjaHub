export interface VendorProfile {
  id: string;
  businessName: string;
  category: 'beauty_and_style' | 'hotel' | 'gifting';
  status: 'pending' | 'approved' | 'rejected';
  latitude: number;
  longitude: number;
  whatsappNumber: string;
}

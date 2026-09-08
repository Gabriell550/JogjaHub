export interface TenantProfile {
  id: number;
  business_name: string;
  description: string | null;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code: string | null;
  };
  latitude: number;
  longitude: number;
  whatsapp_number: string;
  status: 'pending' | 'approved' | 'rejected';
  categories: Array<{
    id: number;
    name: string;
  }>;
}

export interface TenantProfileUpdatePayload {
  business_name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    province: string;
    postal_code?: string;
  };
  latitude: number;
  longitude: number;
  whatsapp_number: string;
  category_ids: number[];
}

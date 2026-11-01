export interface ServiceSubcategory {
  id: number;
  name: string;
  category_id?: number;
  requires_time_slot?: boolean;
}

export interface ServiceTenant {
  business_name: string;
  address?: string | null;
  location?: { latitude: number; longitude: number } | null;
}

export interface ServicePhoto {
  url: string;
  full_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number | string;
  photos: ServicePhoto[] | null;
  subcategory?: ServiceSubcategory;
  tenant?: ServiceTenant;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
}

export interface ServicePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedServices {
  data: Service[];
  meta: ServicePaginationMeta;
}

export interface ServiceCategory {
  id: number;
  name: string;
  subcategories: ServiceSubcategory[];
}

export interface TimeSlot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  quota: number;
  booked_count: number;
  available: number;
}

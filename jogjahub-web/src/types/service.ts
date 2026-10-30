export interface ServiceSubcategory {
  id: number;
  name: string;
}

export interface ServiceTenant {
  business_name: string;
  address?: string | null;
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
}

export interface ServiceCategory {
  id: number;
  name: string;
  subcategories: ServiceSubcategory[];
}

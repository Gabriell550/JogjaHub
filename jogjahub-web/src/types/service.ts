export interface ServiceSubcategory {
  id: number;
  name: string;
}

export interface ServiceTenant {
  business_name: string;
  address?: string | null;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  photos: string[] | null;
  subcategory?: ServiceSubcategory;
  tenant?: ServiceTenant;
}

export interface PaginatedServices {
  data: Service[];
}

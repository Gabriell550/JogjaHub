export interface VendorSummary {
  id: string;
  name: string;
  status: "active" | "pending" | "inactive";
  rating: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

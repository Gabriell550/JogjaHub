export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: "active" | "pending" | "inactive";
  rating?: number;
}

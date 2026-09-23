export interface AdminOverviewCard {
  label: string;
  value: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
}

import type { UserRole } from "@/src/types/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

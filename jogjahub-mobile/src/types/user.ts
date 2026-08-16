export type UserRole = 'customer' | 'vendor' | 'tenant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

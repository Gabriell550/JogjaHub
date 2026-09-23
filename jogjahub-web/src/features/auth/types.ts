export type UserRole = "customer" | "vendor" | "admin";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  userId: string;
  role: UserRole;
}

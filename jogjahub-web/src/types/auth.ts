export type UserRole = "customer" | "vendor" | "admin";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
}

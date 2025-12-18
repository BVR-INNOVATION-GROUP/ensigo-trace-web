export type UserRole = "collector" | "nursery" | "partner" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  region?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}


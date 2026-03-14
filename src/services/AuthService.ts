import { AuthRepository } from "../repositories/AuthRepository";
import type { LoginCredentials, AuthResponse, RegisterData } from "../models/User";

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!credentials.email.trim()) {
      throw new Error("Email is required");
    }
    if (!credentials.password.trim()) {
      throw new Error("Password is required");
    }
    return this.repo.login(credentials);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (!data.name.trim()) {
      throw new Error("Name is required");
    }
    if (!data.email.trim()) {
      throw new Error("Email is required");
    }
    if (!data.password.trim()) {
      throw new Error("Password is required");
    }
    if (!data.business_name?.trim()) {
      throw new Error("Nursery or organisation name is required");
    }

    return this.repo.register({
      ...data,
      role: "regional_nursery",
    });
  }

  async logout(): Promise<void> {
    return this.repo.logout();
  }
}


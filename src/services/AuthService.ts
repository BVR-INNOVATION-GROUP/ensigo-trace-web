import { AuthRepository } from "../repositories/AuthRepository";
import type { LoginCredentials, AuthResponse } from "../models/User";

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

  async logout(): Promise<void> {
    return this.repo.logout();
  }
}


import type { LoginCredentials, AuthResponse, User } from "../models/User";
import usersData from "../data/users.json";

export class AuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = (usersData as User[]).find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user || user.password !== credentials.password) {
      throw new Error("Invalid credentials. Use demo123 as password.");
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token: `mock-token-${user.id}-${Date.now()}`,
    };
  }

  async logout(): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    // In a real app, this would call the API to invalidate the token
  }
}


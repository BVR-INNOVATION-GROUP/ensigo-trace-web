import type {
  LoginCredentials,
  AuthResponse,
  User,
  RegisterData,
} from "../models/User";
import api from "../api/client";
import usersData from "../data/users.json";

export class AuthRepository {
  private useAPI = true;

  constructor() {
    this.checkAPIAvailability();
  }

  private async checkAPIAvailability() {
    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4545"
        }/api/v1/health`
      );
      this.useAPI = true;
    } catch {
      this.useAPI = false;
      console.log("API unavailable, using mock auth");
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this.useAPI) {
      try {
        const response = await api.login(
          credentials.email,
          credentials.password
        );
        // Store token
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        return {
          user: this.mapToLegacyUser(response.user),
          token: response.token,
        };
      } catch (err: unknown) {
        const error = err as Error;
        // If API returns auth error, throw it
        if (
          error.message.includes("invalid") ||
          error.message.includes("credentials")
        ) {
          throw new Error("Invalid credentials");
        }
        console.error("API error, falling back to mock auth:", err);
      }
    }

    // Fallback to mock auth
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = (usersData as (User & { password?: string })[]).find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user || user.password !== credentials.password) {
      throw new Error("Invalid credentials. Use demo123 as password.");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const token = `mock-token-${user.id}-${Date.now()}`;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));

    return {
      user: userWithoutPassword as User,
      token,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (this.useAPI) {
      try {
        const response = await api.register({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          role: data.role,
          region: data.region,
          business_name: data.business_name,
          business_description: data.business_description,
        });
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        return {
          user: this.mapToLegacyUser(response.user),
          token: response.token,
        };
      } catch (err) {
        console.error("Registration error:", err);
        throw err;
      }
    }

    throw new Error("Registration requires API connection");
  }

  async logout(): Promise<void> {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async getProfile(): Promise<User | null> {
    const token = localStorage.getItem("token");
    if (!token) return null;

    if (this.useAPI) {
      try {
        const user = await api.getProfile();
        localStorage.setItem("user", JSON.stringify(user));
        return this.mapToLegacyUser(user);
      } catch {
        // Token invalid, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      }
    }

    // Fallback to cached user
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLegacyUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: this.mapRole(user.role),
      region: user.region,
      business_id: user.business_id,
      business_name: user.business_name,
      business_description: user.business_description,
      business_logo: user.business_logo,
      latitude: user.latitude,
      longitude: user.longitude,
      address: user.address,
      profile_photo: user.profile_photo,
      bio: user.bio,
      is_verified: user.is_verified,
      is_active: user.is_active,
      created_at: user.created_at,
      catalogue: user.catalogue,
    };
  }

  private mapRole(role: string): User["role"] {
    // Map new role names to legacy names for backward compatibility
    const roleMap: Record<string, User["role"]> = {
      collector: "collector",
      super_nursery: "super_nursery",
      community_nursery: "community_nursery",
      regional_nursery: "regional_nursery",
      partner: "partner",
      admin: "admin",
      // Legacy mappings
      nursery: "super_nursery",
    };
    return roleMap[role] || "collector";
  }
}

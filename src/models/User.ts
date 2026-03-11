// User roles – must match backend/DB (entity.UserRole)
export type UserRole =
  | "collector"
  | "super_nursery"
  | "community_nursery"
  | "regional_nursery"
  | "partner"
  | "admin";

/** All DB user roles in one place */
export const USER_ROLES: UserRole[] = [
  "collector",
  "super_nursery",
  "community_nursery",
  "regional_nursery",
  "partner",
  "admin",
];

/** Nursery-type roles (all map to /nursery routes) */
export const NURSERY_ROLES: UserRole[] = [
  "super_nursery",
  "community_nursery",
  "regional_nursery",
];

export function isNurseryRole(role: UserRole): boolean {
  return NURSERY_ROLES.includes(role);
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  region?: string;

  // Business Profile
  business_id: string;
  business_name?: string;
  business_description?: string;
  business_logo?: string;

  // Location
  latitude?: number;
  longitude?: number;
  address?: string;

  // Profile
  profile_photo?: string;
  bio?: string;
  is_verified: boolean;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at?: string;

  // Relations
  catalogue?: CollectorSpecies[];
}

export interface CollectorSpecies {
  id: string;
  species_id: string;
  species: Species;
  notes?: string;
  is_available: boolean;
}

export interface Species {
  id: string;
  scientific_name: string;
  common_name?: string;
  local_name?: string;
  family?: string;
  description?: string;
  ecological_zone?: string;
  native_region?: string;
  growth_rate?: string;
  max_height?: number;
  seeds_per_kg?: number;
  germination_days?: number;
  germination_rate?: number;
  uses?: string;
  conservation_status?: string;
  photo_url?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  region?: string;
  business_name?: string;
  business_description?: string;
}
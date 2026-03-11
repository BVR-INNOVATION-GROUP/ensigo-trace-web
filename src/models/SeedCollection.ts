import type { Species } from "./User";

export type CollectionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_nursery"
  | "distributed"
  | "planted";

export type CollectionUnit = "count" | "kg" | "g";

export interface SeedCollectionI {
  id: string;
  collection_number?: string;
  batch_number?: string;
  status?: CollectionStatus;

  // Species & Tree
  species?: string;
  species_id?: string;
  species_data?: Species;
  motherTree?: string;
  mother_tree_id?: string;

  // Quantity
  quantity: number;
  unit: CollectionUnit;

  // Location
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  village?: string;

  // Collector
  collector_id?: string;
  collector_name?: string;

  // Target Nursery
  target_nursery_id?: string;
  target_nursery_name?: string;

  // Dates
  collection_date?: string;
  submitted_at?: string;
  reviewed_at?: string;

  // Review
  reviewer_id?: string;
  review_notes?: string;
  quality_rating?: number;

  // Media
  photos?: string[];

  // Additional
  additionalInfo?: string;

  // Germination (for batches)
  germinationRate?: number;
}

export interface MotherTree {
  id: string;
  tree_id: string;
  species_id: string;
  species?: Species;
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  village?: string;
  ecological_zone?: string;
  age?: number;
  height?: number;
  dbh?: number;
  crown_diameter?: number;
  health_status?: "excellent" | "good" | "fair" | "poor";
  photo_url?: string;
  registered_by_id?: string;
  registered_date?: string;
  total_collections?: number;
  is_verified?: boolean;
}

export interface Nursery {
  id: string;
  nursery_id: string;
  name: string;
  type: "regional" | "super" | "community";
  description?: string;
  logo?: string;
  location?: string;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  current_stock: number;
  operator_id?: string;
  parent_nursery_id?: string;
  regional_nursery_id?: string;
  contact_email?: string;
  contact_phone?: string;
  offers_seedlings?: boolean;
  offers_training?: boolean;
  offers_contracts?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface CollectorStats {
  total_collections: number;
  pending_reviews: number;
  approved: number;
  rejected: number;
  total_quantity: number;
  unique_species: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  count: number;
  region?: string;
}

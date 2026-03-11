import api, {
  SeedCollection,
  CreateCollectionRequest,
  CollectorStats,
  LocationPoint,
} from "../api/client";
import { seedCollectionsMockData } from "../data/seedCollections";
import type { SeedCollectionI } from "../models/SeedCollection";

export class SeedCollectionRepository {
  private storageKey = "seed_collections";
  private useAPI = true;

  constructor() {
    // Check if API is available
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
      console.log("API unavailable, using localStorage fallback");
    }
  }

  async getAll(): Promise<SeedCollectionI[]> {
    if (this.useAPI) {
      try {
        const response = await api.getMyCollections({ limit: 100 });
        const collections = response.data.map(this.mapToLegacyFormat);
        // Cache for offline use
        localStorage.setItem(this.storageKey, JSON.stringify(collections));
        return collections;
      } catch (err) {
        console.error("API error, falling back to localStorage:", err);
      }
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(this.storageKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Use mock data as last resort
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(seedCollectionsMockData)
    );
    return seedCollectionsMockData;
  }

  async create(
    collection: Omit<SeedCollectionI, "id">
  ): Promise<SeedCollectionI> {
    if (this.useAPI) {
      try {
        const request: CreateCollectionRequest = {
          species_id: collection.species_id,
          species_name: collection.species,
          mother_tree_id: collection.mother_tree_id,
          quantity: collection.quantity,
          unit: collection.unit,
          latitude: collection.latitude,
          longitude: collection.longitude,
          region: collection.region,
          district: collection.district,
          village: collection.village,
          target_nursery_id: collection.target_nursery_id,
          collection_date: collection.collection_date,
          additional_info: collection.additionalInfo,
          photos: collection.photos,
        };
        const created = await api.createCollection(request);
        return this.mapToLegacyFormat(created);
      } catch (err) {
        console.error("API error, falling back to localStorage:", err);
      }
    }

    // Fallback to localStorage
    const collections = await this.getAll();
    const newCollection: SeedCollectionI = {
      id: crypto.randomUUID(),
      ...collection,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };
    collections.push(newCollection);
    localStorage.setItem(this.storageKey, JSON.stringify(collections));
    return newCollection;
  }

  async update(
    id: string,
    updates: Partial<Omit<SeedCollectionI, "id">>
  ): Promise<SeedCollectionI | null> {
    if (this.useAPI) {
      try {
        const updated = await api.updateCollection(id, {
          status: updates.status,
          review_notes: updates.review_notes,
          quality_rating: updates.quality_rating,
        });
        return this.mapToLegacyFormat(updated);
      } catch (err) {
        console.error("API error, falling back to localStorage:", err);
      }
    }

    // Fallback to localStorage
    const collections = await this.getAll();
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) return null;
    collections[index] = { ...collections[index], ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(collections));
    return collections[index];
  }

  async delete(id: string): Promise<boolean> {
    // For now, only localStorage delete is supported
    const collections = await this.getAll();
    const filtered = collections.filter((c) => c.id !== id);
    if (filtered.length === collections.length) return false;
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }

  async getStats(): Promise<CollectorStats> {
    if (this.useAPI) {
      try {
        return await api.getMyStats();
      } catch (err) {
        console.error("API error:", err);
      }
    }

    // Calculate from localStorage
    const collections = await this.getAll();
    return {
      total_collections: collections.length,
      pending_reviews: collections.filter((c) => c.status === "pending").length,
      approved: collections.filter((c) => c.status === "approved").length,
      rejected: collections.filter((c) => c.status === "rejected").length,
      total_quantity: collections.reduce((sum, c) => sum + c.quantity, 0),
      unique_species: new Set(collections.map((c) => c.species_id || c.species))
        .size,
    };
  }

  async getLocations(): Promise<LocationPoint[]> {
    if (this.useAPI) {
      try {
        return await api.getMyLocations();
      } catch (err) {
        console.error("API error:", err);
      }
    }

    // Calculate from localStorage
    const collections = await this.getAll();
    const locationMap = new Map<string, LocationPoint>();

    collections
      .filter((c) => c.latitude && c.longitude)
      .forEach((c) => {
        const key = `${c.latitude},${c.longitude}`;
        const existing = locationMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          locationMap.set(key, {
            latitude: c.latitude!,
            longitude: c.longitude!,
            count: 1,
            region: c.region,
          });
        }
      });

    return Array.from(locationMap.values());
  }

  private mapToLegacyFormat(collection: SeedCollection): SeedCollectionI {
    return {
      id: collection.id,
      collection_number: collection.collection_number,
      batch_number: collection.batch_number,
      status: collection.status,
      species: collection.species_name || collection.species?.scientific_name,
      species_id: collection.species_id,
      motherTree:
        collection.species_name || collection.species?.scientific_name,
      mother_tree_id: collection.mother_tree_id,
      quantity: collection.quantity,
      unit: collection.unit,
      latitude: collection.latitude,
      longitude: collection.longitude,
      region: collection.region,
      district: collection.district,
      village: collection.village,
      collector_id: collection.collector_id,
      collector_name: collection.collector?.name,
      target_nursery_id: collection.target_nursery_id,
      target_nursery_name: collection.target_nursery?.name,
      collection_date: collection.collection_date,
      submitted_at: collection.submitted_at,
      reviewed_at: collection.reviewed_at,
      review_notes: collection.review_notes,
      quality_rating: collection.quality_rating,
      photos: collection.photos ? JSON.parse(collection.photos) : undefined,
      additionalInfo: collection.additional_info,
    };
  }
}

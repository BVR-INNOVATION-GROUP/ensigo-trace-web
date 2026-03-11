"use client";

import { useState, useEffect, useCallback } from "react";
import api, {
  SeedCollection,
  CollectorStats,
  LocationPoint,
  CreateCollectionRequest,
} from "@/src/api/client";

export function useCollections() {
  const [collections, setCollections] = useState<SeedCollection[]>([]);
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const [collectionsRes, statsRes, locationsRes] = await Promise.all([
        api.getMyCollections({ limit: 100 }),
        api.getMyStats(),
        api.getMyLocations(),
      ]);
      setCollections(collectionsRes.data);
      setStats(statsRes);
      setLocations(locationsRes);
      setError(null);
    } catch (err) {
      setError("Failed to load collections");
      console.error("Error fetching collections:", err);
      // Use localStorage fallback for offline mode
      const cached = localStorage.getItem("seed_collections");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCollections(parsed);
          // Calculate stats from cached data
          setStats({
            total_collections: parsed.length,
            pending_reviews: parsed.filter(
              (c: SeedCollection) => c.status === "pending"
            ).length,
            approved: parsed.filter(
              (c: SeedCollection) => c.status === "approved"
            ).length,
            rejected: parsed.filter(
              (c: SeedCollection) => c.status === "rejected"
            ).length,
            total_quantity: parsed.reduce(
              (sum: number, c: SeedCollection) => sum + c.quantity,
              0
            ),
            unique_species: new Set(
              parsed.map((c: SeedCollection) => c.species_id || c.species_name)
            ).size,
          });
        } catch {
          // Invalid cache
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollection = useCallback(
    async (data: CreateCollectionRequest) => {
      const newCollection = await api.createCollection(data);
      setCollections((prev) => [newCollection, ...prev]);
      // Refresh stats
      try {
        const newStats = await api.getMyStats();
        setStats(newStats);
      } catch {
        // Update stats locally
        if (stats) {
          setStats({
            ...stats,
            total_collections: stats.total_collections + 1,
            pending_reviews: stats.pending_reviews + 1,
            total_quantity: stats.total_quantity + data.quantity,
          });
        }
      }
      return newCollection;
    },
    [stats]
  );

  const uploadPhotos = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    try {
      const result = await api.uploadMultiple(files, "collections");
      return result.files.map((f: { url: string }) => f.url);
    } catch (err) {
      console.error("Error uploading photos:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    stats,
    locations,
    loading,
    error,
    createCollection,
    uploadPhotos,
    refetch: fetchCollections,
  };
}

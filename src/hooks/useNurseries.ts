"use client";

import { useState, useEffect, useCallback } from "react";
import api, { Nursery, NurseryCollector } from "@/src/api/client";

export function useNurseries() {
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [myNurseries, setMyNurseries] = useState<NurseryCollector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNurseries = useCallback(async () => {
    try {
      setLoading(true);
      const [allNurseries, collectorNurseries] = await Promise.all([
        api
          .getNurseries({ limit: 100 })
          .catch(() => ({ data: [] as Nursery[] })),
        api.getMyNurseries().catch(() => [] as NurseryCollector[]),
      ]);
      setNurseries(allNurseries.data);
      setMyNurseries(collectorNurseries);
      setError(null);
    } catch (err) {
      setError("Failed to load nurseries");
      console.error("Error fetching nurseries:", err);
      // Fallback for demo
      setNurseries(defaultNurseries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNurseries();
  }, [fetchNurseries]);

  return { nurseries, myNurseries, loading, error, refetch: fetchNurseries };
}

// Default nurseries for fallback
const defaultNurseries: Nursery[] = [
  {
    id: "1",
    nursery_id: "NUR-REG-WN-0001",
    name: "SNNOC West Nile",
    type: "regional",
    region: "West Nile",
    location: "Arua District",
    capacity: 500000,
    current_stock: 125000,
    offers_seedlings: true,
    offers_training: true,
    offers_contracts: true,
    is_active: true,
    is_verified: true,
  },
  {
    id: "2",
    nursery_id: "NUR-SUP-WN-0001",
    name: "Arua Super Nursery",
    type: "super",
    region: "West Nile",
    location: "Arua Town",
    capacity: 1000000,
    current_stock: 450000,
    offers_seedlings: true,
    offers_training: false,
    offers_contracts: false,
    is_active: true,
    is_verified: true,
  },
  {
    id: "3",
    nursery_id: "NUR-COM-WN-0001",
    name: "Maracha Community Nursery",
    type: "community",
    region: "West Nile",
    location: "Maracha District",
    capacity: 100000,
    current_stock: 35000,
    offers_seedlings: true,
    offers_training: false,
    offers_contracts: false,
    is_active: true,
    is_verified: false,
  },
];

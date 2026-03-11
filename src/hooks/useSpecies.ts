"use client";

import { useState, useEffect, useCallback } from "react";
import api, { Species } from "@/src/api/client";

export function useSpecies() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getSpecies({ limit: 500 });
      setSpecies(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load species");
      console.error("Error fetching species:", err);
      // Fallback to default species for offline/demo mode
      setSpecies(defaultSpecies);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSpecies = useCallback(
    async (query: string): Promise<Species[]> => {
      if (!query || query.length < 2) return species;
      try {
        return await api.searchSpecies(query);
      } catch {
        // Fallback to local filter
        return species.filter(
          (s) =>
            s.scientific_name.toLowerCase().includes(query.toLowerCase()) ||
            s.common_name?.toLowerCase().includes(query.toLowerCase()) ||
            s.local_name?.toLowerCase().includes(query.toLowerCase())
        );
      }
    },
    [species]
  );

  useEffect(() => {
    fetchSpecies();
  }, [fetchSpecies]);

  return { species, loading, error, searchSpecies, refetch: fetchSpecies };
}

// Default species for fallback
const defaultSpecies: Species[] = [
  {
    id: "1",
    scientific_name: "Albizia coriaria",
    common_name: "Chester Wood",
    local_name: "Musita",
  },
  {
    id: "2",
    scientific_name: "Markhamia lutea",
    common_name: "Nile Tulip",
    local_name: "Nsambya",
  },
  {
    id: "3",
    scientific_name: "Khaya anthotheca",
    common_name: "East African Mahogany",
    local_name: "Munyama",
  },
  {
    id: "4",
    scientific_name: "Milicia excelsa",
    common_name: "African Teak",
    local_name: "Mvule",
  },
  {
    id: "5",
    scientific_name: "Prunus africana",
    common_name: "African Cherry",
    local_name: "Ngote",
  },
  {
    id: "6",
    scientific_name: "Cordia africana",
    common_name: "Sudan Teak",
    local_name: "Mkoyo",
  },
  {
    id: "7",
    scientific_name: "Maesopsis eminii",
    common_name: "Umbrella Tree",
    local_name: "Musizi",
  },
  {
    id: "8",
    scientific_name: "Terminalia superba",
    common_name: "Limba",
    local_name: "Muyovu",
  },
  {
    id: "9",
    scientific_name: "Ficus natalensis",
    common_name: "Bark Cloth Fig",
    local_name: "Mutuba",
  },
  {
    id: "10",
    scientific_name: "Podocarpus milanjianus",
    common_name: "African Yellowwood",
    local_name: "Podo",
  },
];

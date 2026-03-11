"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Modal } from "@/components/ui/modal";
import { UGANDA_REGIONS } from "@/lib/uganda-data";
import type { SeedCollection } from "@/src/api/client";

// Uganda center and bounds
const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;

// Approximate region boundaries (polygon coordinates)
const REGION_BOUNDARIES: Record<string, [number, number][]> = {
  Central: [
    [0.8, 31.5],
    [0.8, 33.0],
    [0.0, 33.0],
    [-0.5, 32.5],
    [-0.8, 31.8],
    [-0.2, 31.0],
    [0.4, 31.2],
  ],
  Eastern: [
    [0.8, 33.0],
    [1.5, 33.5],
    [2.0, 34.5],
    [1.0, 35.0],
    [0.5, 34.5],
    [-0.5, 34.0],
    [-1.0, 33.8],
    [0.0, 33.0],
  ],
  Northern: [
    [2.0, 31.0],
    [2.5, 31.5],
    [3.5, 32.0],
    [4.0, 33.0],
    [3.8, 34.0],
    [3.0, 34.5],
    [2.0, 34.5],
    [1.5, 33.5],
    [0.8, 33.0],
    [0.8, 31.5],
    [1.2, 31.2],
  ],
  Western: [
    [0.4, 31.2],
    [-0.2, 31.0],
    [-0.8, 31.8],
    [-1.5, 31.5],
    [-1.5, 30.0],
    [-0.5, 29.5],
    [0.5, 29.8],
    [1.2, 30.2],
    [1.5, 30.8],
    [1.2, 31.2],
  ],
  "West Nile": [
    [2.0, 31.0],
    [2.5, 31.5],
    [3.5, 32.0],
    [3.8, 31.5],
    [3.5, 30.8],
    [3.0, 30.5],
    [2.5, 30.8],
    [2.2, 31.0],
  ],
};

// Heat map color scale (low to high intensity)
function getHeatColor(intensity: number): string {
  // intensity: 0 to 1
  // Color scale: light gray -> yellow -> orange -> red
  if (intensity === 0) return "#e5e7eb"; // gray-200
  if (intensity < 0.2) return "#fef3c7"; // amber-100
  if (intensity < 0.4) return "#fcd34d"; // amber-300
  if (intensity < 0.6) return "#f59e0b"; // amber-500
  if (intensity < 0.8) return "#ea580c"; // orange-600
  return "#dc2626"; // red-600
}

interface RegionMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections?: SeedCollection[];
}

export function RegionMapModal({ isOpen, onClose, collections = [] }: RegionMapModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats per region
  const regionStats = useMemo(() => {
    const stats: Record<string, { count: number; quantity: number; collections: SeedCollection[] }> = {};

    UGANDA_REGIONS.forEach(region => {
      stats[region.name] = { count: 0, quantity: 0, collections: [] };
    });

    collections.forEach(c => {
      const regionName = c.region || "Unknown";
      const matchedRegion = Object.keys(stats).find(
        r => r.toLowerCase() === regionName.toLowerCase()
      );

      if (matchedRegion) {
        stats[matchedRegion].count++;
        stats[matchedRegion].quantity += c.quantity || 0;
        stats[matchedRegion].collections.push(c);
      }
    });

    return stats;
  }, [collections]);

  // Get max count for normalization
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(regionStats).map(s => s.count), 1);
  }, [regionStats]);

  // Collections with coordinates for markers
  const collectionsWithCoords = useMemo(() => {
    return collections.filter(c => c.latitude && c.longitude);
  }, [collections]);

  // Total stats for legend
  const totalStats = useMemo(() => {
    return {
      count: collections.length,
      quantity: collections.reduce((sum, c) => sum + (c.quantity || 0), 0),
    };
  }, [collections]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collection Heat Map" className="opacity-0" size="xl">
      <div className="p-4">
        <div className="h-[500px] rounded-lg overflow-hidden relative">
          {/* name = main.a */}
          <MapContainer
            center={UGANDA_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render region polygons with heat map coloring */}
            {UGANDA_REGIONS.map((region) => {
              const boundaries = REGION_BOUNDARIES[region.name];
              const stats = regionStats[region.name];

              if (!boundaries) return null;

              const intensity = stats ? stats.count / maxCount : 0;
              const color = getHeatColor(intensity);
              const fillOpacity = stats && stats.count > 0 ? 0.6 : 0.3;

              return (
                <Polygon
                  key={region.name}
                  positions={boundaries}
                  pathOptions={{
                    color: "#374151",
                    fillColor: color,
                    fillOpacity: fillOpacity,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="center" className="region-heat-label">
                    <div className="text-center px-2 py-1">
                      <span className="font-bold text-sm block">{region.name}</span>
                      {stats && stats.count > 0 ? (
                        <>
                          <span className="text-lg font-bold text-primary block">{stats.count}</span>
                          <span className="text-xs opacity-70">collections</span>
                          <span className="text-xs block mt-1">{stats.quantity.toFixed(1)} kg</span>
                        </>
                      ) : (
                        <span className="text-xs opacity-50 block">No collections</span>
                      )}
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

            {/* Render collection markers */}
            {collectionsWithCoords.map((collection, index) => (
              <CircleMarker
                key={`col-${collection.id || index}`}
                center={[collection.latitude!, collection.longitude!]}
                radius={6}
                pathOptions={{
                  fillColor: "#fff",
                  fillOpacity: 0.9,
                  color: "#374151",
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[150px]">
                    <p className="font-semibold text-primary">
                      {collection.collection_number || collection.batch_number}
                    </p>
                    <p className="font-medium">
                      {collection.species?.scientific_name || collection.species_name || "Unknown"}
                    </p>
                    <p className="text-[var(--very-dark-color)]/70">
                      {collection.quantity} {collection.unit}
                    </p>
                    {collection.district && (
                      <p className="text-xs text-[var(--very-dark-color)]/50 mt-1">
                        {collection.district}, {collection.region}
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Heat Map Legend - overlaid on map */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <p className="text-xs font-semibold text-[var(--very-dark-color)] mb-2">Collection Intensity</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--very-dark-color)]/60">Low</span>
              <div className="flex h-3">
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-full"
                    style={{ backgroundColor: getHeatColor(i) }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[var(--very-dark-color)]/60">High</span>
            </div>
          </div>

          {/* Summary - overlaid on map */}
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <p className="text-xs text-[var(--very-dark-color)]/60">Total</p>
            <p className="text-lg font-bold text-[var(--very-dark-color)]">{totalStats.count} <span className="text-xs font-normal">collections</span></p>
            <p className="text-sm text-primary font-medium">{totalStats.quantity.toFixed(1)} kg</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default RegionMapModal;

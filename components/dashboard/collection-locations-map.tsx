"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { LocationPoint } from "@/src/models/SeedCollection";
import type { SeedCollection } from "@/src/api/client";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface CollectionLocationsMapProps {
  locations?: LocationPoint[];
  collections?: SeedCollection[];
  height?: string;
  showClusters?: boolean;
}

export function CollectionLocationsMap({
  locations = [],
  collections = [],
  height = "400px",
  showClusters = true,
}: CollectionLocationsMapProps) {
  // Calculate center from locations
  const center = useMemo(() => {
    const allPoints = [
      ...locations.map((l) => ({ lat: l.latitude, lng: l.longitude })),
      ...collections
        .filter((c) => c.latitude && c.longitude)
        .map((c) => ({ lat: c.latitude!, lng: c.longitude! })),
    ];

    if (allPoints.length === 0) {
      // Default to Uganda
      return { lat: 3.0, lng: 30.9 };
    }

    const avgLat =
      allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng =
      allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    return { lat: avgLat, lng: avgLng };
  }, [locations, collections]);

  // Group collections by region for visualization
  const regionGroups = useMemo(() => {
    const groups: Record<
      string,
      { lat: number; lng: number; count: number; collections: SeedCollection[] }
    > = {};

    collections
      .filter((c) => c.latitude && c.longitude)
      .forEach((c) => {
        const region = c.region || "Unknown";
        if (!groups[region]) {
          groups[region] = {
            lat: c.latitude!,
            lng: c.longitude!,
            count: 0,
            collections: [],
          };
        }
        groups[region].count++;
        groups[region].collections.push(c);
      });

    return groups;
  }, [collections]);

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const hasData =
    locations.length > 0 ||
    collections.filter((c) => c.latitude && c.longitude).length > 0;

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center bg-pale rounded-lg border border-[var(--very-dark-color)]/10"
        style={{ height }}
      >
        <div className="text-center text-[var(--very-dark-color)]/50">
          <p className="text-sm">No location data available</p>
          <p className="text-xs mt-1">
            Locations will appear here as you submit collections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render location points */}
        {locations.map((loc, index) => (
          <CircleMarker
            key={`loc-${index}`}
            center={[loc.latitude, loc.longitude]}
            radius={Math.min(20, 8 + loc.count * 2)}
            pathOptions={{
              fillColor: "#22c55e",
              fillOpacity: 0.7,
              color: "#166534",
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{loc.region || "Unknown Region"}</p>
                <p>{loc.count} collection{loc.count !== 1 ? "s" : ""}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Render individual collections */}
        {!showClusters &&
          collections
            .filter((c) => c.latitude && c.longitude)
            .map((collection, index) => (
              <Marker
                key={`col-${index}`}
                position={[collection.latitude!, collection.longitude!]}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">
                      {collection.species_name || collection.species?.scientific_name}
                    </p>
                    <p>
                      {collection.quantity} {collection.unit}
                    </p>
                    <p className="text-xs text-[var(--very-dark-color)]/50">
                      {new Date(collection.collection_date).toLocaleDateString()}
                    </p>
                    {collection.region && (
                      <p className="text-xs text-[var(--very-dark-color)]/50">{collection.region}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* Render region clusters */}
        {showClusters &&
          Object.entries(regionGroups).map(([region, data]) => (
            <CircleMarker
              key={`region-${region}`}
              center={[data.lat, data.lng]}
              radius={Math.min(30, 10 + data.count * 3)}
              pathOptions={{
                fillColor: "#3b82f6",
                fillOpacity: 0.6,
                color: "#1d4ed8",
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{region}</p>
                  <p>{data.count} collection{data.count !== 1 ? "s" : ""}</p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {data.collections.slice(0, 5).map((c, i) => (
                      <p key={i} className="text-xs text-[var(--very-dark-color)]/60">
                        • {c.species_name || c.species?.scientific_name} ({c.quantity} {c.unit})
                      </p>
                    ))}
                    {data.collections.length > 5 && (
                      <p className="text-xs text-[var(--very-dark-color)]/40">
                        +{data.collections.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}

export default CollectionLocationsMap;

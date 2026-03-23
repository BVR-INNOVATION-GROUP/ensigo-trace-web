"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Nursery } from "@/src/api/client";
import { useTheme } from "@/components/theme/theme-provider";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface NurseryLocationsMapProps {
  nurseries: Nursery[];
  height?: string;
}

export function NurseryLocationsMap({ nurseries, height = "300px" }: NurseryLocationsMapProps) {
  const { resolvedTheme } = useTheme();
  const points = useMemo(
    () =>
      nurseries
        .filter((n) => typeof n.latitude === "number" && typeof n.longitude === "number")
        .map((n) => ({
          id: n.id,
          name: n.name,
          region: n.region || n.location || "Unknown",
          lat: n.latitude as number,
          lng: n.longitude as number,
          stock: n.current_stock || 0,
          capacity: n.capacity || 0,
          verified: n.is_verified,
        })),
    [nurseries]
  );

  const center = useMemo(() => {
    if (points.length === 0) return { lat: 3.0, lng: 30.9 };
    return {
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
    };
  }, [points]);

  useEffect(() => {
    const existing = document.querySelector('link[data-leaflet="true"]');
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet", "true");
    document.head.appendChild(link);
  }, []);

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-pale rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-[var(--very-dark-color)]/60">No nurseries with coordinates yet.</p>
      </div>
    );
  }

  return (
    <div className="nursery-geo-map rounded-lg overflow-hidden relative isolate z-0" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={8}
        className="z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={
            resolvedTheme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={Math.min(18, 6 + point.stock / 5000)}
            pathOptions={{
              fillColor: point.verified ? "#16a34a" : "#f59e0b",
              fillOpacity: 0.7,
              color: point.verified ? "#166534" : "#92400e",
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{point.name}</p>
                <p>{point.region}</p>
                <p>
                  Stock: {point.stock.toLocaleString()} / {point.capacity.toLocaleString()}
                </p>
                <p>Status: {point.verified ? "Verified" : "Pending"}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default NurseryLocationsMap;

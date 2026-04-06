"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MotherTree } from "@/src/data/mockData";
import type { DivIcon } from "leaflet";
import { useTheme } from "@/components/theme/theme-provider";

// Create custom tree icon for marker
const createTreeIcon = async (): Promise<DivIcon> => {
  const L = await import("leaflet");
  return L.divIcon({
    className: "custom-tree-marker",
    html: `
      <div style="
        background-color: #1d7c2e;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z"/>
          <path d="M10 14L10 20L14 20L14 14" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 20L15 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Dynamically import map components to avoid SSR issues
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

interface ProvenanceMapProps {
  trees: Array<{
    id: string;
    species: string;
    gpsCoordinates: { lat: number; lng: number };
    age: number;
    height: number;
    ecologicalZone: string;
    healthStatus: string;
    registeredDate: string;
  }>;
}

export function ProvenanceMap({ trees }: ProvenanceMapProps) {
  const [treeIcon, setTreeIcon] = useState<DivIcon | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  useEffect(() => {
    let isActive = true;
    createTreeIcon().then((icon) => {
      if (isActive) setTreeIcon(icon);
    });
    return () => {
      isActive = false;
    };
  }, []);

  // Calculate center point from all trees (West Nile region)
  const centerLat = trees.length > 0
    ? trees.reduce((sum, tree) => sum + tree.gpsCoordinates.lat, 0) / trees.length
    : 3.0324; // Default to Arua, West Nile
  const centerLng = trees.length > 0
    ? trees.reduce((sum, tree) => sum + tree.gpsCoordinates.lng, 0) / trees.length
    : 30.9108;

  if (!treeIcon) {
    return (
      <div className="w-full h-full rounded-lg bg-pale flex items-center justify-center">
        <p className="text-caption">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="collector-geo-map w-full h-full rounded-lg overflow-hidden relative">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={trees.length > 0 ? 11 : 8}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={`tiles-${resolvedTheme}`}
          attribution={tileAttribution}
          url={tileUrl}
        />
        {trees.map((tree) => (
          <Marker
            key={tree.id}
            position={[tree.gpsCoordinates.lat, tree.gpsCoordinates.lng]}
            icon={treeIcon}
          >
            <Popup>
              <div className="text-body-sm">
                <p className="text-label font-medium">{tree.id}</p>
                <p className="text-label mt-1">{tree.species}</p>
                <p className="text-caption opacity-75 mt-1">
                  Age: {tree.age} years • Height: {tree.height}m
                </p>
                <p className="text-caption opacity-75 mt-1">
                  {tree.gpsCoordinates.lat.toFixed(2)}, {tree.gpsCoordinates.lng.toFixed(2)}
                </p>
                <p className="text-caption opacity-75 mt-1">
                  Zone: {tree.ecologicalZone}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute bottom-4 left-4 bg-paper p-3 rounded shadow-custom z-1000">
        <p className="text-label font-medium">West Nile Provenance Zone</p>
        <p className="text-caption opacity-75">{trees.length} verified mother trees</p>
      </div>
    </div>
  );
}








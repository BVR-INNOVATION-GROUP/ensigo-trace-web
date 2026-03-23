"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/theme/theme-provider";

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Uganda center coordinates (roughly Kampala)
const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;
const MARKER_ZOOM = 13;

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  onMapClick?: (lat: number, lng: number) => void;
  disabled?: boolean;
  className?: string;
}

// Component to handle map clicks
function MapClickHandler({ 
  onMapClick, 
  disabled 
}: { 
  onMapClick?: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to recenter map when marker changes
function MapRecenter({ 
  latitude, 
  longitude 
}: { 
  latitude?: number; 
  longitude?: number;
}) {
  const map = useMap();
  const hasSetInitial = useRef(false);

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], MARKER_ZOOM, { animate: true });
      hasSetInitial.current = true;
    } else if (!hasSetInitial.current) {
      map.setView(UGANDA_CENTER, DEFAULT_ZOOM);
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LocationMap({
  latitude,
  longitude,
  onMapClick,
  disabled = false,
  className,
}: LocationMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const center: [number, number] = latitude && longitude 
    ? [latitude, longitude] 
    : UGANDA_CENTER;

  const zoom = latitude && longitude ? MARKER_ZOOM : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`nursery-geo-map h-full w-full ${className || ""}`}
      style={{ cursor: disabled ? "default" : "crosshair" }}
    >
      <TileLayer
        key={`tiles-${resolvedTheme}`}
        attribution={tileAttribution}
        url={tileUrl}
      />
      
      <MapClickHandler onMapClick={onMapClick} disabled={disabled} />
      <MapRecenter latitude={latitude} longitude={longitude} />
      
      {latitude && longitude && (
        <Marker position={[latitude, longitude]} icon={DefaultIcon} />
      )}
    </MapContainer>
  );
}

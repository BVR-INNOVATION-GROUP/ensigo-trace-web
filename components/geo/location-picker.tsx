"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Crosshair, Loader2, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "./address-autocomplete";
import { RegionDistrictSelect } from "./region-district-select";
import {
  reverseGeocode,
  getCurrentLocationWithAddress,
  isWithinUganda,
  formatCoordinates,
  type GeoLocation,
  type GeoSearchResult,
} from "@/lib/geo-service";

// Dynamic import for map to avoid SSR issues
const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-pale rounded-lg flex items-center justify-center">
      <Loader2 className="animate-spin opacity-40" size={32} />
    </div>
  ),
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  village?: string;
  onLocationChange?: (location: {
    latitude?: number;
    longitude?: number;
    region?: string;
    district?: string;
    village?: string;
    address?: string;
  }) => void;
  showMap?: boolean;
  showSearch?: boolean;
  showGpsButton?: boolean;
  showCoordinateInputs?: boolean;
  showRegionDistrict?: boolean;
  disabled?: boolean;
  className?: string;
  mapHeight?: string;
}

export function LocationPicker({
  latitude,
  longitude,
  region = "",
  district = "",
  village = "",
  onLocationChange,
  showMap = true,
  showSearch = true,
  showGpsButton = true,
  showCoordinateInputs = true,
  showRegionDistrict = true,
  disabled = false,
  className,
  mapHeight = "h-64",
}: LocationPickerProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [locationData, setLocationData] = useState({
    region,
    district,
    village,
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState(latitude?.toString() || "");
  const [manualLng, setManualLng] = useState(longitude?.toString() || "");

  // Update coords when props change
  useEffect(() => {
    if (latitude && longitude) {
      setCoords({ lat: latitude, lng: longitude });
      setManualLat(latitude.toString());
      setManualLng(longitude.toString());
    }
  }, [latitude, longitude]);

  // Update location data when props change
  useEffect(() => {
    setLocationData(prev => ({
      ...prev,
      region,
      district,
      village,
    }));
  }, [region, district, village]);

  // Emit changes to parent
  const emitChange = useCallback(
    (updates: Partial<typeof locationData> & { latitude?: number; longitude?: number }) => {
      const newLocation = {
        latitude: updates.latitude ?? coords?.lat,
        longitude: updates.longitude ?? coords?.lng,
        region: updates.region ?? locationData.region,
        district: updates.district ?? locationData.district,
        village: updates.village ?? locationData.village,
        address: updates.address ?? locationData.address,
      };
      onLocationChange?.(newLocation);
    },
    [coords, locationData, onLocationChange]
  );

  // Get current GPS location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocationWithAddress();

      if (location) {
        // Validate Uganda bounds
        if (!isWithinUganda(location.latitude, location.longitude)) {
          setError("Location appears to be outside Uganda. Please verify.");
        }

        setCoords({ lat: location.latitude, lng: location.longitude });
        setManualLat(location.latitude.toFixed(6));
        setManualLng(location.longitude.toFixed(6));

        const newData = {
          region: location.region || locationData.region,
          district: location.district || locationData.district,
          village: location.village || locationData.village,
          address: location.displayName,
        };
        setLocationData(newData);

        emitChange({
          latitude: location.latitude,
          longitude: location.longitude,
          ...newData,
        });
      }
    } catch (err: any) {
      let errorMessage = "Failed to get location";

      if (err.code === 1) {
        errorMessage = "Location access denied. Please enable location permissions.";
      } else if (err.code === 2) {
        errorMessage = "Location unavailable. Please try again.";
      } else if (err.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    if (disabled) return;

    setCoords({ lat, lng });
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setIsLoading(true);
    setError(null);

    try {
      const location = await reverseGeocode(lat, lng);

      if (location) {
        if (!isWithinUganda(lat, lng)) {
          setError("Location appears to be outside Uganda. Please verify.");
        }

        const newData = {
          region: location.region || locationData.region,
          district: location.district || locationData.district,
          village: location.village || locationData.village,
          address: location.displayName,
        };
        setLocationData(newData);

        emitChange({
          latitude: lat,
          longitude: lng,
          ...newData,
        });
      } else {
        emitChange({ latitude: lat, longitude: lng });
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
      emitChange({ latitude: lat, longitude: lng });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search result selection
  const handleSearchSelect = (result: GeoSearchResult) => {
    const lat = result.latitude;
    const lng = result.longitude;

    setCoords({ lat, lng });
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));

    const newData = {
      region: result.address.region || result.address.state || locationData.region,
      district: result.address.district || result.address.county || locationData.district,
      village: result.address.village || result.address.town || locationData.village,
      address: result.displayName,
    };
    setLocationData(newData);

    emitChange({
      latitude: lat,
      longitude: lng,
      ...newData,
    });
  };

  // Handle manual coordinate input
  const handleManualCoordChange = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid coordinates");
      return;
    }

    if (!isWithinUganda(lat, lng)) {
      setError("Coordinates appear to be outside Uganda.");
    } else {
      setError(null);
    }

    setCoords({ lat, lng });
    setIsLoading(true);

    try {
      const location = await reverseGeocode(lat, lng);

      if (location) {
        const newData = {
          region: location.region || locationData.region,
          district: location.district || locationData.district,
          village: location.village || locationData.village,
          address: location.displayName,
        };
        setLocationData(newData);
        emitChange({ latitude: lat, longitude: lng, ...newData });
      } else {
        emitChange({ latitude: lat, longitude: lng });
      }
    } catch (err) {
      emitChange({ latitude: lat, longitude: lng });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle region/district/village changes
  const handleRegionChange = (value: string) => {
    setLocationData(prev => ({ ...prev, region: value }));
    emitChange({ region: value });
  };

  const handleDistrictChange = (value: string) => {
    setLocationData(prev => ({ ...prev, district: value }));
    emitChange({ district: value });
  };

  const handleVillageChange = (value: string) => {
    setLocationData(prev => ({ ...prev, village: value }));
    emitChange({ village: value });
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Search Bar */}
      {showSearch && (
        <div>
          <label className="block text-label mb-3">
            {/* <Search size={16} className="inline mr-1" /> */}
            Search Location
          </label>
          <AddressAutocomplete
            placeholder="Search for a place in Uganda..."
            onSelect={handleSearchSelect}
            disabled={disabled}
          />
        </div>
      )}

      {/* GPS Button */}
      {showGpsButton && (
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={handleGetCurrentLocation}
            variant="pale"
            className="bg-[var(--very-dark-color)] rounded-full text-white hover:bg-[var(--very-dark-color)]/90"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Crosshair size={18} className="mr-2" />
            )}
            {isLoading ? "Getting Location..." : "Use My Location"}
          </Button>

          {coords && (
            <span className="text-caption opacity-70">
              <MapPin size={14} className="inline mr-1" />
              {formatCoordinates(coords.lat, coords.lng)}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-pale-dark rounded-lg border border-[var(--very-dark-color)]/10 text-body-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Map */}
      {showMap && (
        <div className={cn("rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10", mapHeight)}>
          <LocationMap
            latitude={coords?.lat}
            longitude={coords?.lng}
            onMapClick={handleMapClick}
            disabled={disabled}
          />
        </div>
      )}

      {/* Coordinate Inputs */}
      {showCoordinateInputs && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-label mb-3">Latitude</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 3.0339"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={handleManualCoordChange}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-label mb-3">Longitude</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 30.9107"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              onBlur={handleManualCoordChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Region/District/Village Selection */}
      {showRegionDistrict && (
        <RegionDistrictSelect
          region={locationData.region}
          district={locationData.district}
          village={locationData.village}
          onRegionChange={handleRegionChange}
          onDistrictChange={handleDistrictChange}
          onVillageChange={handleVillageChange}
          disabled={disabled}
        />
      )}

      {/* Address Display */}
      {locationData.address && (
        <div className="p-4 bg-pale rounded-lg border border-[var(--very-dark-color)]/10">
          <p className="text-body-sm opacity-80">
            <MapPin size={14} className="inline mr-1" />
            {locationData.address}
          </p>
        </div>
      )}
    </div>
  );
}

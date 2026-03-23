"use client";

import dynamic from "next/dynamic";
import { Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AddressAutocomplete,
  RegionDistrictSelect,
  formatCoordinates,
  type GeoSearchResult,
} from "@/components/geo";

const LocationMap = dynamic(() => import("@/components/geo/location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] bg-pale flex items-center justify-center rounded-lg">
      <Loader2 className="animate-spin text-[var(--muted)]" size={32} />
    </div>
  ),
});

export interface RegionalNurseryFormState {
  name: string;
  description: string;
  location: string;
  region: string;
  district: string;
  capacity: string;
  latitude: string;
  longitude: string;
  contact_email: string;
  contact_phone: string;
}

interface RegionalNurseryFormGridProps {
  formData: RegionalNurseryFormState;
  setFormData: (next: RegionalNurseryFormState | ((prev: RegionalNurseryFormState) => RegionalNurseryFormState)) => void;
  locationLoading: boolean;
  onSearchSelect: (result: GeoSearchResult) => void;
  onMapClick: (lat: number, lng: number) => void | Promise<void>;
  onGetLocation: () => void | Promise<void>;
  /** Primary nursery / organisation name field label */
  nameLabel?: string;
  namePlaceholder?: string;
  showContactFields?: boolean;
  mapMinHeightClass?: string;
}

export function RegionalNurseryFormGrid({
  formData,
  setFormData,
  locationLoading,
  onSearchSelect,
  onMapClick,
  onGetLocation,
  nameLabel = "Nursery name",
  namePlaceholder = "Enter nursery name",
  showContactFields = true,
  mapMinHeightClass = "min-h-[300px]",
}: RegionalNurseryFormGridProps) {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
      <div className="bg-pale p-6 sm:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto scrollbar-thin">
        <h3 className="text-h5 mb-6 text-[var(--very-dark-color)]">Site location</h3>

        <div className="mb-6">
          <label className="block text-label mb-3 text-[var(--very-dark-color)]">Search location</label>
          <AddressAutocomplete
            placeholder="Search for a place in Uganda…"
            onSelect={onSearchSelect}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            onClick={() => void onGetLocation()}
            variant="default"
            className="rounded-full"
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Crosshair size={16} className="mr-2" />
            )}
            Use my location
          </Button>
          {formData.latitude && formData.longitude && (
            <span className="text-caption text-[var(--very-dark-color)]/70">
              {formatCoordinates(parseFloat(formData.latitude), parseFloat(formData.longitude))}
            </span>
          )}
        </div>

        <div className={`flex-1 ${mapMinHeightClass} rounded-lg overflow-hidden border border-[var(--border)]`}>
          <LocationMap
            latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
            longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
            onMapClick={onMapClick}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-6">
          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">Latitude</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 3.0339"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">Longitude</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g., 30.9107"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-paper p-6 sm:p-8 overflow-y-auto scrollbar-thin">
        <h3 className="text-h5 mb-6 text-[var(--very-dark-color)]">Nursery details</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">{nameLabel} *</label>
            <Input
              placeholder={namePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">Description</label>
            <Input
              placeholder="Brief description of the nursery"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">Administrative area</label>
            <RegionDistrictSelect
              region={formData.region}
              district={formData.district}
              onRegionChange={(value) => setFormData({ ...formData, region: value })}
              onDistrictChange={(value) => setFormData({ ...formData, district: value })}
              showVillage={false}
              layout="vertical"
            />
          </div>

          <div>
            <label className="block text-label mb-3 text-[var(--very-dark-color)]">Capacity (seedlings) *</label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 100000"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
          </div>

          {showContactFields ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-label mb-3 text-[var(--very-dark-color)]">Contact email</label>
                <Input
                  type="email"
                  placeholder="nursery@example.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-label mb-3 text-[var(--very-dark-color)]">Contact phone</label>
                <Input
                  placeholder="+256…"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function emptyRegionalNurseryForm(): RegionalNurseryFormState {
  return {
    name: "",
    description: "",
    location: "",
    region: "",
    district: "",
    capacity: "",
    latitude: "",
    longitude: "",
    contact_email: "",
    contact_phone: "",
  };
}

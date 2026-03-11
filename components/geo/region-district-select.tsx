"use client";

import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { 
  getRegionOptions, 
  getDistrictOptions,
  getRegionByDistrict,
  getTownsByDistrict,
} from "@/lib/uganda-data";

const OTHER_VALUE = "__other__";

interface RegionDistrictSelectProps {
  region?: string;
  district?: string;
  village?: string;
  onRegionChange?: (region: string) => void;
  onDistrictChange?: (district: string) => void;
  onVillageChange?: (village: string) => void;
  showVillage?: boolean;
  disabled?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}

// Helper to find matching option value (case-insensitive)
function findMatchingOption(value: string, options: { value: string; label: string }[]): string {
  if (!value) return "";
  const lowerValue = value.toLowerCase().trim();
  const match = options.find(opt => 
    opt.value.toLowerCase() === lowerValue || 
    opt.label.toLowerCase() === lowerValue
  );
  return match?.value || "";
}

export function RegionDistrictSelect({
  region = "",
  district = "",
  village = "",
  onRegionChange,
  onDistrictChange,
  onVillageChange,
  showVillage = true,
  disabled = false,
  layout = "horizontal",
  className,
}: RegionDistrictSelectProps) {
  const regionOptions = getRegionOptions();
  
  // Find matching region from options (case-insensitive)
  const initialRegion = findMatchingOption(region, regionOptions) || (region && !findMatchingOption(region, regionOptions) ? OTHER_VALUE : "");
  const initialDistrict = findMatchingOption(district, getDistrictOptions(initialRegion !== OTHER_VALUE ? initialRegion : "")) || (district && !findMatchingOption(district, getDistrictOptions()) ? OTHER_VALUE : "");
  
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedVillage, setSelectedVillage] = useState(village);
  const [customRegion, setCustomRegion] = useState(initialRegion === OTHER_VALUE ? region : "");
  const [customDistrict, setCustomDistrict] = useState(initialDistrict === OTHER_VALUE ? district : "");
  const [districtOptions, setDistrictOptions] = useState(getDistrictOptions());
  const [villageSuggestions, setVillageSuggestions] = useState<string[]>([]);

  // Update internal state when props change
  useEffect(() => {
    const matched = findMatchingOption(region, regionOptions);
    if (matched) {
      setSelectedRegion(matched);
      setCustomRegion("");
    } else if (region) {
      setSelectedRegion(OTHER_VALUE);
      setCustomRegion(region);
    } else {
      setSelectedRegion("");
      setCustomRegion("");
    }
  }, [region]);

  useEffect(() => {
    const options = getDistrictOptions(selectedRegion !== OTHER_VALUE ? selectedRegion : "");
    const matched = findMatchingOption(district, options);
    if (matched) {
      setSelectedDistrict(matched);
      setCustomDistrict("");
    } else if (district) {
      setSelectedDistrict(OTHER_VALUE);
      setCustomDistrict(district);
    } else {
      setSelectedDistrict("");
      setCustomDistrict("");
    }
  }, [district, selectedRegion]);

  useEffect(() => {
    setSelectedVillage(village);
  }, [village]);

  // Update district options when region changes
  useEffect(() => {
    if (selectedRegion) {
      setDistrictOptions(getDistrictOptions(selectedRegion));
    } else {
      setDistrictOptions(getDistrictOptions());
    }
  }, [selectedRegion]);

  // Update village suggestions when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setVillageSuggestions(getTownsByDistrict(selectedDistrict));
    } else {
      setVillageSuggestions([]);
    }
  }, [selectedDistrict]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // Clear district when region changes
    if (value !== selectedRegion) {
      setSelectedDistrict("");
      onDistrictChange?.("");
    }
    onRegionChange?.(value);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    onDistrictChange?.(value);

    // Auto-fill region if not set
    if (!selectedRegion) {
      const inferredRegion = getRegionByDistrict(value);
      if (inferredRegion) {
        setSelectedRegion(inferredRegion);
        onRegionChange?.(inferredRegion);
      }
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedVillage(value);
    onVillageChange?.(value);
  };

  const villageOptions = villageSuggestions.map(v => ({ value: v, label: v }));

  const containerClass = layout === "horizontal" 
    ? showVillage ? "grid grid-cols-3 gap-6" : "grid grid-cols-2 gap-6"
    : "space-y-5";

  return (
    <div className={className}>
      <div className={containerClass}>
        <div>
          <label className="block text-label mb-3">Region</label>
          <CustomSelect
            name="region"
            value={selectedRegion}
            onChange={handleRegionChange}
            options={regionOptions}
            placeholder="Select region"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-label mb-3">District</label>
          <CustomSelect
            name="district"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            options={districtOptions}
            placeholder="Select district"
            disabled={disabled}
          />
        </div>

        {showVillage && (
          <div>
            <label className="block text-label mb-3">Village/Town</label>
            {villageSuggestions.length > 0 ? (
              <CustomSelect
                name="village"
                value={selectedVillage}
                onChange={(value) => {
                  setSelectedVillage(value);
                  onVillageChange?.(value);
                }}
                options={[
                  { value: "", label: "Enter custom or select..." },
                  ...villageOptions,
                ]}
                placeholder="Select or type village"
                disabled={disabled}
              />
            ) : (
              <Input
                name="village"
                type="text"
                placeholder="Enter village name"
                value={selectedVillage}
                onChange={handleVillageChange}
                disabled={disabled}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

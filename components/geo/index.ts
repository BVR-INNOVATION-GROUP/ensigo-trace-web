// Geo Components - Location input and display
export { AddressAutocomplete } from "./address-autocomplete";
export { RegionDistrictSelect } from "./region-district-select";
export { LocationPicker } from "./location-picker";
export { RegionMapModal } from "./region-map-modal";

// Re-export geo utilities
export {
  searchLocation,
  reverseGeocode,
  getCurrentPosition,
  getCurrentLocationWithAddress,
  isWithinUganda,
  formatCoordinates,
  calculateDistance,
  type GeoLocation,
  type GeoSearchResult,
} from "@/lib/geo-service";

export {
  UGANDA_REGIONS,
  ALL_DISTRICTS,
  UNIQUE_DISTRICTS,
  REGION_NAMES,
  getDistrictsByRegion,
  getRegionByDistrict,
  searchDistricts,
  isValidDistrict,
  isValidRegion,
  getRegionOptions,
  getDistrictOptions,
  getTownsByDistrict,
} from "@/lib/uganda-data";

/**
 * Geo Service using Nominatim (OpenStreetMap) - Free API
 * Documentation: https://nominatim.org/release-docs/latest/api/Overview/
 * 
 * Usage Policy: Max 1 request per second, include User-Agent header
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  region?: string;
  district?: string;
  village?: string;
  country?: string;
  countryCode?: string;
}

export interface GeoSearchResult {
  placeId: string;
  latitude: number;
  longitude: number;
  displayName: string;
  type: string;
  importance: number;
  address: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    district?: string;
    state?: string;
    region?: string;
    country?: string;
    countryCode?: string;
  };
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "EnsigoTrace/1.0";

// Rate limiting: Ensure at least 1 second between requests
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
  });
}

/**
 * Search for locations by name/address (forward geocoding)
 */
export async function searchLocation(
  query: string,
  options: {
    countryCode?: string;
    limit?: number;
    bounded?: boolean;
    viewbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  } = {}
): Promise<GeoSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: String(options.limit || 5),
  });

  // Focus on Uganda by default
  if (options.countryCode) {
    params.append("countrycodes", options.countryCode);
  } else {
    params.append("countrycodes", "ug"); // Default to Uganda
  }

  // Uganda bounding box for better results
  if (options.viewbox) {
    params.append("viewbox", options.viewbox.join(","));
    params.append("bounded", options.bounded ? "1" : "0");
  } else {
    // Default Uganda viewbox
    params.append("viewbox", "29.5,-1.5,35.0,4.3");
  }

  try {
    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      placeId: item.place_id,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
      importance: item.importance,
      address: {
        village: item.address?.village || item.address?.hamlet,
        town: item.address?.town,
        city: item.address?.city,
        county: item.address?.county,
        district: item.address?.county || item.address?.state_district,
        state: item.address?.state,
        region: item.address?.state, // In Uganda, state maps to region
        country: item.address?.country,
        countryCode: item.address?.country_code,
      },
    }));
  } catch (error) {
    console.error("Search location error:", error);
    return [];
  }
}

/**
 * Get location details from coordinates (reverse geocoding)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeoLocation | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    addressdetails: "1",
    zoom: "18", // High zoom for detailed address
  });

  try {
    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("Reverse geocoding error:", data.error);
      return null;
    }

    const address = data.address || {};

    return {
      latitude,
      longitude,
      displayName: data.display_name,
      region: address.state || address.region,
      district: address.county || address.state_district,
      village: address.village || address.hamlet || address.town || address.city,
      country: address.country,
      countryCode: address.country_code,
    };
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
}

/**
 * Get browser's current location with high accuracy
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get current location with reverse geocoding
 */
export async function getCurrentLocationWithAddress(): Promise<GeoLocation | null> {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    const location = await reverseGeocode(latitude, longitude);
    
    if (location) {
      return location;
    }
    
    // Return basic location if reverse geocoding fails
    return {
      latitude,
      longitude,
      displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    };
  } catch (error) {
    console.error("Get current location error:", error);
    throw error;
  }
}

/**
 * Validate coordinates are within Uganda bounds
 */
export function isWithinUganda(latitude: number, longitude: number): boolean {
  // Uganda approximate bounding box
  const UGANDA_BOUNDS = {
    minLat: -1.5,
    maxLat: 4.3,
    minLon: 29.5,
    maxLon: 35.0,
  };

  return (
    latitude >= UGANDA_BOUNDS.minLat &&
    latitude <= UGANDA_BOUNDS.maxLat &&
    longitude >= UGANDA_BOUNDS.minLon &&
    longitude <= UGANDA_BOUNDS.maxLon
  );
}

/**
 * Format coordinates to display string
 */
export function formatCoordinates(latitude: number, longitude: number, precision: number = 6): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}

/**
 * Calculate distance between two points in kilometers (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

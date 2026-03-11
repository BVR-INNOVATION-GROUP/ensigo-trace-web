/**
 * Uganda Administrative Data
 * Regions and Districts for accurate location input
 * 
 * Uganda has 4 main regions and 135+ districts
 */

export interface UgandaDistrict {
  name: string;
  region: string;
}

export interface UgandaRegion {
  name: string;
  districts: string[];
}

// Uganda Regions with their Districts
export const UGANDA_REGIONS: UgandaRegion[] = [
  {
    name: "Central",
    districts: [
      "Buikwe", "Bukomansimbi", "Butambala", "Buvuma", "Gomba", "Kalangala",
      "Kalungu", "Kampala", "Kayunga", "Kiboga", "Kyankwanzi", "Luweero",
      "Lwengo", "Lyantonde", "Masaka", "Mityana", "Mpigi", "Mubende",
      "Mukono", "Nakaseke", "Nakasongola", "Rakai", "Sembabule", "Wakiso",
      "Kassanda", "Kyotera"
    ]
  },
  {
    name: "Eastern",
    districts: [
      "Amuria", "Budaka", "Bududa", "Bugiri", "Bukedea", "Bukwo",
      "Bulambuli", "Busia", "Butaleja", "Buyende", "Iganga", "Jinja",
      "Kaberamaido", "Kaliro", "Kamuli", "Kapchorwa", "Katakwi", "Kibuku",
      "Kumi", "Kween", "Luuka", "Manafwa", "Mayuge", "Mbale",
      "Namayingo", "Namutumba", "Ngora", "Pallisa", "Serere", "Sironko",
      "Soroti", "Tororo", "Butebo", "Namisindwa", "Bugweri", "Kapelebyong"
    ]
  },
  {
    name: "Northern",
    districts: [
      "Abim", "Adjumani", "Agago", "Alebtong", "Amolatar", "Amudat",
      "Amuru", "Apac", "Arua", "Dokolo", "Gulu", "Kaabong",
      "Kitgum", "Koboko", "Kole", "Kotido", "Lamwo", "Lira",
      "Maracha", "Moroto", "Moyo", "Nakapiripirit", "Napak", "Nebbi",
      "Nwoya", "Omoro", "Otuke", "Oyam", "Pader", "Pakwach",
      "Yumbe", "Zombo", "Kwania", "Madi-Okollo", "Obongi", "Karenga",
      "Nabilatuk", "Kaabong", "Terego"
    ]
  },
  {
    name: "Western",
    districts: [
      "Buhweju", "Buliisa", "Bundibugyo", "Bushenyi", "Hoima", "Ibanda",
      "Isingiro", "Kabale", "Kabarole", "Kamwenge", "Kanungu", "Kasese",
      "Kibaale", "Kiruhura", "Kiryandongo", "Kisoro", "Kyegegwa", "Kyenjojo",
      "Masindi", "Mbarara", "Mitooma", "Ntoroko", "Ntungamo", "Rubirizi",
      "Rukiga", "Rukungiri", "Sheema", "Kagadi", "Kakumiro", "Rubanda",
      "Bunyangabu", "Rwampara", "Kikuube"
    ]
  },
  {
    name: "West Nile",
    districts: [
      "Adjumani", "Arua", "Koboko", "Maracha", "Moyo", "Nebbi",
      "Pakwach", "Yumbe", "Zombo", "Madi-Okollo", "Obongi", "Terego"
    ]
  }
];

// Flat list of all districts with their regions
export const ALL_DISTRICTS: UgandaDistrict[] = UGANDA_REGIONS.flatMap(region =>
  region.districts.map(district => ({
    name: district,
    region: region.name
  }))
);

// Get unique district names (some districts appear in multiple regions)
export const UNIQUE_DISTRICTS = [...new Set(ALL_DISTRICTS.map(d => d.name))].sort();

// Region names only
export const REGION_NAMES = UGANDA_REGIONS.map(r => r.name);

/**
 * Get districts by region name
 */
export function getDistrictsByRegion(regionName: string): string[] {
  const region = UGANDA_REGIONS.find(
    r => r.name.toLowerCase() === regionName.toLowerCase()
  );
  return region ? region.districts.sort() : [];
}

/**
 * Get region by district name
 */
export function getRegionByDistrict(districtName: string): string | undefined {
  const district = ALL_DISTRICTS.find(
    d => d.name.toLowerCase() === districtName.toLowerCase()
  );
  return district?.region;
}

/**
 * Search districts by partial name
 */
export function searchDistricts(query: string): UgandaDistrict[] {
  const lowerQuery = query.toLowerCase();
  return ALL_DISTRICTS.filter(
    d => d.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Validate if a district exists
 */
export function isValidDistrict(districtName: string): boolean {
  return ALL_DISTRICTS.some(
    d => d.name.toLowerCase() === districtName.toLowerCase()
  );
}

/**
 * Validate if a region exists
 */
export function isValidRegion(regionName: string): boolean {
  return REGION_NAMES.some(
    r => r.toLowerCase() === regionName.toLowerCase()
  );
}

/**
 * Convert region/district options for select components
 */
export function getRegionOptions() {
  return REGION_NAMES.map(name => ({
    value: name,
    label: name
  }));
}

export function getDistrictOptions(regionName?: string) {
  const districts = regionName 
    ? getDistrictsByRegion(regionName)
    : UNIQUE_DISTRICTS;
  
  return districts.map(name => ({
    value: name,
    label: name
  }));
}

// Major towns/trading centers for common villages
export const MAJOR_TOWNS: Record<string, string[]> = {
  "Arua": ["Arua City", "Oluko", "Offaka", "Vurra", "Ayivuni", "Pajulu"],
  "Moyo": ["Moyo Town", "Laropi", "Lefori", "Metu", "Gimara"],
  "Yumbe": ["Yumbe Town", "Kochi", "Midigo", "Kululu", "Lodonga"],
  "Adjumani": ["Adjumani Town", "Ofua", "Dzaipi", "Adropi", "Pachara"],
  "Koboko": ["Koboko Town", "Kuluba", "Lobule", "Ludara"],
  "Nebbi": ["Nebbi Town", "Pakwach", "Panyimur", "Kucwiny", "Erussi"],
  "Zombo": ["Paidha", "Zeu", "Kango", "Abira"],
  "Gulu": ["Gulu City", "Pece", "Laroo", "Bardege", "Layibi"],
  "Lira": ["Lira City", "Adyel", "Ojwina", "Railways", "Starch"],
};

/**
 * Get towns/trading centers for a district
 */
export function getTownsByDistrict(districtName: string): string[] {
  return MAJOR_TOWNS[districtName] || [];
}

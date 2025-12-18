// Mock data for EnsigoTrace platform

export interface SeedBatch {
  id: string;
  batchNumber: string;
  species: string;
  quantity: number;
  unit: "kg" | "seeds";
  collectorName: string;
  collectionDate: string;
  gpsCoordinates: { lat: number; lng: number };
  motherTreeId: string;
  region: string;
  status: "pending" | "approved" | "in-nursery" | "distributed" | "planted";
  photoUrl?: string;
  germinationRate?: number;
  nurseryId?: string;
}

export interface MotherTree {
  id: string;
  species: string;
  gpsCoordinates: { lat: number; lng: number };
  age: number;
  height: number;
  ecologicalZone: string;
  healthStatus: "excellent" | "good" | "fair" | "poor";
  photoUrl?: string;
  registeredDate: string;
}

export interface Nursery {
  id: string;
  name: string;
  location: string;
  gpsCoordinates: { lat: number; lng: number };
  capacity: number;
  currentStock: number;
  operator: string;
  activeBatches: number;
}

export interface RestorationProject {
  id: string;
  name: string;
  partner: string;
  location: string;
  targetTrees: number;
  plantedTrees: number;
  species: string[];
  startDate: string;
  status: "planning" | "active" | "completed";
}

export const mockSeedBatches: SeedBatch[] = [
  {
    id: "SB-001",
    batchNumber: "ENS-WN-001",
    species: "Albizia coriaria",
    quantity: 25,
    unit: "kg",
    collectorName: "John Okello",
    collectionDate: "2025-01-10",
    gpsCoordinates: { lat: 3.0324, lng: 30.9108 },
    motherTreeId: "MT-001",
    region: "West Nile - Arua",
    status: "in-nursery",
    germinationRate: 78,
    nurseryId: "NUR-001",
  },
  {
    id: "SB-002",
    batchNumber: "ENS-WN-002",
    species: "Markhamia lutea",
    quantity: 5000,
    unit: "seeds",
    collectorName: "Sarah Namuli",
    collectionDate: "2025-01-15",
    gpsCoordinates: { lat: 3.0456, lng: 30.9234 },
    motherTreeId: "MT-002",
    region: "West Nile - Arua",
    status: "approved",
    nurseryId: "NUR-001",
  },
  {
    id: "SB-003",
    batchNumber: "ENS-WN-003",
    species: "Khaya anthotheca",
    quantity: 15,
    unit: "kg",
    collectorName: "John Okello",
    collectionDate: "2025-01-20",
    gpsCoordinates: { lat: 3.0201, lng: 30.8987 },
    motherTreeId: "MT-003",
    region: "West Nile - Arua",
    status: "pending",
  },
  {
    id: "SB-004",
    batchNumber: "ENS-WN-004",
    species: "Milicia excelsa",
    quantity: 8000,
    unit: "seeds",
    collectorName: "Mary Achan",
    collectionDate: "2025-02-01",
    gpsCoordinates: { lat: 3.0567, lng: 30.9345 },
    motherTreeId: "MT-004",
    region: "West Nile - Arua",
    status: "distributed",
    germinationRate: 85,
    nurseryId: "NUR-001",
  },
  {
    id: "SB-005",
    batchNumber: "ENS-WN-005",
    species: "Prunus africana",
    quantity: 12,
    unit: "kg",
    collectorName: "Peter Drani",
    collectionDate: "2025-02-05",
    gpsCoordinates: { lat: 3.0123, lng: 30.8876 },
    motherTreeId: "MT-005",
    region: "West Nile - Arua",
    status: "in-nursery",
    germinationRate: 72,
    nurseryId: "NUR-002",
  },
];

export const mockMotherTrees: MotherTree[] = [
  {
    id: "MT-001",
    species: "Albizia coriaria",
    gpsCoordinates: { lat: 3.0324, lng: 30.9108 },
    age: 25,
    height: 18,
    ecologicalZone: "Tropical Savanna",
    healthStatus: "excellent",
    registeredDate: "2024-06-15",
  },
  {
    id: "MT-002",
    species: "Markhamia lutea",
    gpsCoordinates: { lat: 3.0456, lng: 30.9234 },
    age: 18,
    height: 15,
    ecologicalZone: "Woodland",
    healthStatus: "good",
    registeredDate: "2024-07-20",
  },
  {
    id: "MT-003",
    species: "Khaya anthotheca",
    gpsCoordinates: { lat: 3.0201, lng: 30.8987 },
    age: 40,
    height: 25,
    ecologicalZone: "Forest",
    healthStatus: "excellent",
    registeredDate: "2024-08-10",
  },
  {
    id: "MT-004",
    species: "Milicia excelsa",
    gpsCoordinates: { lat: 3.0567, lng: 30.9345 },
    age: 35,
    height: 22,
    ecologicalZone: "Forest",
    healthStatus: "good",
    registeredDate: "2024-09-05",
  },
  {
    id: "MT-005",
    species: "Prunus africana",
    gpsCoordinates: { lat: 3.0123, lng: 30.8876 },
    age: 30,
    height: 20,
    ecologicalZone: "Montane Forest",
    healthStatus: "good",
    registeredDate: "2024-10-12",
  },
];

export const mockNurseries: Nursery[] = [
  {
    id: "NUR-001",
    name: "Arua Central Nursery",
    location: "Arua District",
    gpsCoordinates: { lat: 3.0195, lng: 30.9110 },
    capacity: 50000,
    currentStock: 23500,
    operator: "Sarah Namuli",
    activeBatches: 3,
  },
  {
    id: "NUR-002",
    name: "West Nile Community Hub",
    location: "Arua District",
    gpsCoordinates: { lat: 3.0412, lng: 30.8956 },
    capacity: 30000,
    currentStock: 8200,
    operator: "James Onen",
    activeBatches: 1,
  },
];

export const mockRestorationProjects: RestorationProject[] = [
  {
    id: "RP-001",
    name: "Mount Wati Reforestation",
    partner: "Green Earth Initiative",
    location: "West Nile Region",
    targetTrees: 50000,
    plantedTrees: 12500,
    species: ["Albizia coriaria", "Markhamia lutea", "Khaya anthotheca"],
    startDate: "2024-11-01",
    status: "active",
  },
  {
    id: "RP-002",
    name: "River Enyau Restoration",
    partner: "Uganda Conservation Foundation",
    location: "Arua District",
    targetTrees: 25000,
    plantedTrees: 8000,
    species: ["Milicia excelsa", "Prunus africana"],
    startDate: "2024-12-15",
    status: "active",
  },
  {
    id: "RP-003",
    name: "Community Forest Recovery",
    partner: "Green Earth Initiative",
    location: "West Nile Region",
    targetTrees: 15000,
    plantedTrees: 15000,
    species: ["Albizia coriaria", "Markhamia lutea"],
    startDate: "2024-08-01",
    status: "completed",
  },
];

export const mockAnalytics = {
  totalSeeds: 128500,
  verifiedMotherTrees: 47,
  germinationRate: 78.5,
  survivalRate: 85.2,
  activeNurseries: 5,
  activeRegions: 3,
  totalPlanted: 35500,
  carbonSequestered: 127.5, // tonnes CO2
  speciesDiversity: 18,
};








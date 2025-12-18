export interface SeedCollectionI {
  id: string;
  motherTree: string;
  unit: "count" | "kg" | "g";
  quantity: number;
  species?: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
}

interface SeedCollectionI {
  id: string;
  motherTree: string;
  unit: "count" | "kg" | "g";
  quantity: number;
}

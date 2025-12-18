import { seedCollectionsMockData } from "../data/seedCollections";
import type { SeedCollectionI } from "../models/SeedCollection";

export class SeedCollectionRepository {
  private storageKey = "seed_collections";
  private defaultList: SeedCollectionI[];

  constructor() {
    this.defaultList = seedCollectionsMockData;
  }

  async getAll(): Promise<SeedCollectionI[]> {
    localStorage.setItem(this.storageKey, JSON.stringify(this?.defaultList));
    return this.defaultList;

    // if not in dev mode
  }

  async create(
    collection: Omit<SeedCollectionI, "id">
  ): Promise<SeedCollectionI> {
    const collections = await this.getAll();
    const newCollection: SeedCollectionI = {
      id: crypto.randomUUID(),
      ...collection,
    };
    collections.push(newCollection);
    localStorage.setItem(this.storageKey, JSON.stringify(collections));
    return newCollection;
  }

  async update(
    id: string,
    updates: Partial<Omit<SeedCollectionI, "id">>
  ): Promise<SeedCollectionI | null> {
    const collections = await this.getAll();
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) return null;
    collections[index] = { ...collections[index], ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(collections));
    return collections[index];
  }

  async delete(id: string): Promise<boolean> {
    const collections = await this.getAll();
    const filtered = collections.filter((c) => c.id !== id);
    if (filtered.length === collections.length) return false;
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }
}

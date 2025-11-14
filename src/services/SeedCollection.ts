import { SeedCollectionRepository } from "../repositories/SeedRepository";

// Service
export class SeedCollectionService {
  private repo: SeedCollectionRepository;

  constructor() {
    this.repo = new SeedCollectionRepository();
  }

  async getAllCollections(): Promise<SeedCollectionI[]> {
    return this.repo.getAll();
  }

  async addCollection(data: Omit<SeedCollectionI, "id">) {
    if (!data.motherTree.trim()) {
      return { success: false, error: "Mother tree name is required" };
    }
    if (data.quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }
    const collection = await this.repo.create(data);
    return { success: true, data: collection };
  }

  async updateCollection(
    id: string,
    updates: Partial<Omit<SeedCollectionI, "id">>
  ) {
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }
    const collection = await this.repo.update(id, updates);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    return { success: true, data: collection };
  }

  async deleteCollection(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }
    return { success: true };
  }
}

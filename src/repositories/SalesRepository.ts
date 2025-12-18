import { mockSales } from "../data/sales";
import type { Sale } from "../models/Sale";

export class SalesRepository {
  private storageKey = "nursery_sales";
  private defaultList: Sale[];

  constructor() {
    this.defaultList = mockSales;
  }

  async getAll(nurseryId?: string): Promise<Sale[]> {
    let sales = this.defaultList;
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      sales = JSON.parse(stored);
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(this.defaultList));
    }
    if (nurseryId) {
      return sales.filter((s) => s.nurseryId === nurseryId);
    }
    return sales;
  }

  async create(sale: Omit<Sale, "id" | "saleNumber">): Promise<Sale> {
    const sales = await this.getAll();
    const saleNumber = `SALE-${new Date().getFullYear()}-${String(sales.length + 1).padStart(3, "0")}`;
    const newSale: Sale = {
      id: crypto.randomUUID(),
      saleNumber,
      ...sale,
    };
    sales.push(newSale);
    localStorage.setItem(this.storageKey, JSON.stringify(sales));
    return newSale;
  }

  async update(
    id: string,
    updates: Partial<Omit<Sale, "id" | "saleNumber">>
  ): Promise<Sale | null> {
    const sales = await this.getAll();
    const index = sales.findIndex((s) => s.id === id);
    if (index === -1) return null;
    sales[index] = { ...sales[index], ...updates };
    localStorage.setItem(this.storageKey, JSON.stringify(sales));
    return sales[index];
  }

  async getById(id: string): Promise<Sale | null> {
    const sales = await this.getAll();
    return sales.find((s) => s.id === id) || null;
  }
}


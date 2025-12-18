import { SalesRepository } from "../repositories/SalesRepository";
import type { Sale } from "../models/Sale";

export class SalesService {
  private repo: SalesRepository;

  constructor() {
    this.repo = new SalesRepository();
  }

  async getAllSales(nurseryId?: string): Promise<Sale[]> {
    return this.repo.getAll(nurseryId);
  }

  async createSale(
    saleData: Omit<Sale, "id" | "saleNumber" | "totalAmount" | "paymentStatus">
  ): Promise<{ success: boolean; data?: Sale; error?: string }> {
    if (!saleData.batchId) {
      return { success: false, error: "Batch ID is required" };
    }
    if (saleData.quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }
    if (!saleData.pricePerUnit || saleData.pricePerUnit <= 0) {
      return { success: false, error: "Price per unit must be greater than 0" };
    }
    if (!saleData.customerName || !saleData.customerEmail || !saleData.customerPhone) {
      return { success: false, error: "Customer information is required" };
    }

    const totalAmount = saleData.quantity * saleData.pricePerUnit;
    const sale = await this.repo.create({
      ...saleData,
      totalAmount,
      paymentStatus: "pending",
    });

    return { success: true, data: sale };
  }

  async updatePaymentStatus(
    saleId: string,
    status: Sale["paymentStatus"],
    transactionReference?: string
  ): Promise<{ success: boolean; data?: Sale; error?: string }> {
    const sale = await this.repo.getById(saleId);
    if (!sale) {
      return { success: false, error: "Sale not found" };
    }

    const updates: Partial<Sale> = { paymentStatus: status };
    if (transactionReference) {
      updates.transactionReference = transactionReference;
    }

    const updated = await this.repo.update(saleId, updates);
    if (!updated) {
      return { success: false, error: "Failed to update sale" };
    }

    return { success: true, data: updated };
  }

  async getSalesStats(nurseryId?: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    pendingPayments: number;
    paidSales: number;
  }> {
    const sales = await this.repo.getAll(nurseryId);
    const totalSales = sales.length;
    const totalRevenue = sales
      .filter((s) => s.paymentStatus === "paid")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const pendingPayments = sales.filter((s) => s.paymentStatus === "pending").length;
    const paidSales = sales.filter((s) => s.paymentStatus === "paid").length;

    return {
      totalSales,
      totalRevenue,
      pendingPayments,
      paidSales,
    };
  }
}


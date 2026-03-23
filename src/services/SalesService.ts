import api, { type CreateSaleRequest, type Sale as ApiSale } from "../api/client";
import type { Sale } from "../models/Sale";

export class SalesService {
  async getAllSales(nurseryId?: string): Promise<Sale[]> {
    const res = await api.getSales({ nursery_id: nurseryId, limit: 500, offset: 0 });
    return (res.data || []).map(this.toUiSale);
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

    try {
      const payload: CreateSaleRequest = {
        batch_id: saleData.batchId,
        quantity: saleData.quantity,
        price_per_unit: saleData.pricePerUnit,
        customer_name: saleData.customerName,
        customer_email: saleData.customerEmail,
        customer_phone: saleData.customerPhone,
        payment_method: saleData.paymentMethod || "cash",
        notes: saleData.notes,
      };
      const sale = await api.createSale(payload);
      return { success: true, data: this.toUiSale(sale) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create sale" };
    }
  }

  async updatePaymentStatus(
    saleId: string,
    status: Sale["paymentStatus"],
    transactionReference?: string
  ): Promise<{ success: boolean; data?: Sale; error?: string }> {
    try {
      const updated = await api.updateSalePaymentStatus(saleId, {
        payment_status: status,
        transaction_reference: transactionReference,
      });
      return { success: true, data: this.toUiSale(updated) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update sale",
      };
    }
  }

  async getSalesStats(nurseryId?: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    pendingPayments: number;
    paidSales: number;
  }> {
    const stats = await api.getSalesStats({ nursery_id: nurseryId });

    return {
      totalSales: stats.total_sales || 0,
      totalRevenue: stats.total_revenue || 0,
      pendingPayments: stats.pending_count || 0,
      paidSales: stats.paid_count || 0,
    };
  }

  private toUiSale(sale: ApiSale): Sale {
    return {
      id: sale.id,
      saleNumber: sale.sale_number,
      batchId: sale.batch_id,
      species: sale.species?.scientific_name || sale.batch?.species?.scientific_name || "Unknown species",
      quantity: sale.quantity,
      unit: sale.unit === "count" ? "seeds" : sale.unit,
      pricePerUnit: sale.price_per_unit,
      totalAmount: sale.total_amount,
      customerName: sale.customer_name || "",
      customerEmail: sale.customer_email || "",
      customerPhone: sale.customer_phone || "",
      paymentStatus: sale.payment_status,
      paymentMethod: sale.payment_method === "mobile_money" ? "flutterwave" : sale.payment_method,
      transactionReference: sale.transaction_reference,
      saleDate: sale.sale_date,
      notes: sale.notes,
      nurseryId: sale.nursery_id,
    };
  }
}


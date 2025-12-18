export interface Sale {
  id: string;
  saleNumber: string;
  batchId: string;
  species: string;
  quantity: number;
  unit: "kg" | "seeds";
  pricePerUnit: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: "flutterwave" | "cash" | "bank_transfer";
  transactionReference?: string;
  saleDate: string;
  notes?: string;
  nurseryId: string;
}


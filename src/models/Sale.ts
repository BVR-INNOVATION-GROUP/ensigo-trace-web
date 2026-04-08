export interface Sale {
  id: string;
  sale_number: string;
  batch_id: string;
  species?: { scientific_name?: string; common_name?: string };
  quantity: number;
  unit: "kg" | "seeds";
  price_per_unit: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method?: "flutterwave" | "cash" | "bank_transfer";
  transaction_reference?: string;
  sale_date: string;
  notes?: string;
  nursery_id: string;
  // New fields for order management
  order_type: "pos" | "online";
  order_status: "pending" | "approved" | "declined" | "fulfilled";
  reviewed_by?: string;
  reviewed_at?: string;
  decline_reason?: string;
  fulfilled_by?: string;
  fulfilled_at?: string;
  // Aliases for backward compatibility (computed getters)
  get saleNumber(): string;
  get batchId(): string;
  get customerName(): string;
  get customerEmail(): string;
  get customerPhone(): string;
  get paymentStatus(): string;
  get paymentMethod(): string;
  get transactionReference(): string;
  get saleDate(): string;
  get nurseryId(): string;
  get orderType(): string;
  get orderStatus(): string;
  get reviewedBy(): string;
  get reviewedAt(): string;
  get declineReason(): string;
  get fulfilledBy(): string;
  get fulfilledAt(): string;
  get totalAmount(): number;
  get pricePerUnit(): number;
}

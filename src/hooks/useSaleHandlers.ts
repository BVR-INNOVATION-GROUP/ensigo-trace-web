import { SalesService } from "@/src/services/SalesService";
import { processFlutterwavePayment } from "./useFlutterwave";
import type { Sale } from "@/src/models/Sale";
import type { SeedBatch } from "@/src/data/mockData";

interface CreateSaleData {
  batchId: string;
  quantity: string;
  pricePerUnit: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: "flutterwave" | "cash" | "bank_transfer";
  notes: string;
}

export function useSaleHandlers(
  availableBatches: SeedBatch[],
  nurseryId: string,
  onSuccess: () => void,
  onError: (error: string) => void
) {
  const salesService = new SalesService();

  const validateSale = (
    formData: CreateSaleData
  ): { valid: boolean; error?: string; batch?: SeedBatch } => {
    const selectedBatch = availableBatches.find((b) => b.id === formData.batchId);
    if (!selectedBatch) {
      return { valid: false, error: "Please select a batch" };
    }

    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    if (quantity <= 0 || quantity > selectedBatch.quantity) {
      return {
        valid: false,
        error: `Quantity must be between 1 and ${selectedBatch.quantity}`,
      };
    }

    if (pricePerUnit <= 0) {
      return { valid: false, error: "Price per unit must be greater than 0" };
    }

    return { valid: true, batch: selectedBatch };
  };

  const createSale = async (formData: CreateSaleData) => {
    const validation = validateSale(formData);
    if (!validation.valid || !validation.batch) {
      onError(validation.error || "Validation failed");
      return;
    }

    const batch = validation.batch;
    const quantity = parseFloat(formData.quantity);
    const pricePerUnit = parseFloat(formData.pricePerUnit);

    const saleData = {
      batchId: formData.batchId,
      species: batch.species,
      quantity,
      unit: batch.unit as "kg" | "seeds",
      pricePerUnit,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      paymentMethod: formData.paymentMethod,
      saleDate: new Date().toISOString().split("T")[0],
      notes: formData.notes,
      nurseryId,
    };

    const result = await salesService.createSale(saleData);

    if (result.success && result.data) {
      if (formData.paymentMethod === "flutterwave") {
        handleFlutterwavePayment(result.data);
      } else {
        onSuccess();
      }
    } else {
      onError(result.error || "Failed to create sale");
    }
  };

  const handleFlutterwavePayment = async (sale: Sale) => {
    processFlutterwavePayment(
      sale,
      async (transactionId) => {
        await salesService.updatePaymentStatus(
          sale.id,
          "paid",
          transactionId || sale.saleNumber
        );
        onSuccess();
      },
      (message) => {
        onError(message || "Payment was not successful. Please try again.");
      }
    );
  };

  return { createSale, handleFlutterwavePayment };
}


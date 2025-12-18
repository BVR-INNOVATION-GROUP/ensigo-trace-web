"use client";

import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { SeedBatch } from "@/src/data/mockData";

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    batchId: string;
    quantity: string;
    pricePerUnit: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod: "flutterwave" | "cash" | "bank_transfer";
    notes: string;
  };
  onFormChange: (updates: Partial<CreateSaleModalProps["formData"]>) => void;
  availableBatches: SeedBatch[];
  isSubmitting: boolean;
}

export function CreateSaleModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  availableBatches,
  isSubmitting,
}: CreateSaleModalProps) {
  const selectedBatch = availableBatches.find((b) => b.id === formData.batchId);
  const calculatedTotal =
    formData.quantity && formData.pricePerUnit
      ? parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Sale" size="lg">
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-label mb-2">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.batchId}
              onChange={(value) => onFormChange({ batchId: value })}
              options={availableBatches.map((b) => ({
                value: b.id,
                label: `${b.species} - Batch ${b.batchNumber} (${b.quantity} ${b.unit} available)`,
              }))}
              placeholder="Select a batch to sell"
            />
            <p className="text-caption opacity-75">
              Choose the batch you want to sell from
            </p>
          </div>

          {selectedBatch && (
            <>
              <div className="p-4 bg-pale rounded-lg">
                <p className="text-label font-medium mb-1">{selectedBatch.species}</p>
                <p className="text-caption opacity-75">
                  Batch {selectedBatch.batchNumber} • Available: {selectedBatch.quantity}{" "}
                  {selectedBatch.unit}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Quantity ({selectedBatch.unit}) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedBatch.quantity}
                    step={selectedBatch.unit === "kg" ? "0.01" : "1"}
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => onFormChange({ quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Price per Unit (UGX) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={formData.pricePerUnit}
                    onChange={(e) => onFormChange({ pricePerUnit: e.target.value })}
                    required
                  />
                </div>
              </div>

              {calculatedTotal > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-label font-medium">Total Amount:</span>
                    <span className="text-h5 text-primary">
                      {calculatedTotal.toLocaleString()} UGX
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <label className="block text-label mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={(e) => onFormChange({ customerName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-label mb-2">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail}
                onChange={(e) => onFormChange({ customerEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-label mb-2">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="+256 700 000 000"
                value={formData.customerPhone}
                onChange={(e) => onFormChange({ customerPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-label mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.paymentMethod}
              onChange={(value) =>
                onFormChange({
                  paymentMethod: value as "flutterwave" | "cash" | "bank_transfer",
                })
              }
              options={[
                { value: "flutterwave", label: "Flutterwave (Online Payment)" },
                { value: "cash", label: "Cash" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
              placeholder="Select payment method"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-label mb-2">Notes</label>
            <Textarea
              placeholder="Add any notes about this sale..."
              value={formData.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Create Sale
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}






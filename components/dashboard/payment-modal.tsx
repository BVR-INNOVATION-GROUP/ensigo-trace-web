"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import type { Sale } from "@/src/models/Sale";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onProcessPayment: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  sale,
  onProcessPayment,
}: PaymentModalProps) {
  if (!sale) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" size="md">
      <div className="p-6">
        <div className="space-y-6">
          <div className="p-4 bg-pale rounded-lg">
            <p className="text-label font-medium mb-2">{sale.species}</p>
            <p className="text-caption opacity-75">
              Sale {sale.saleNumber} • {sale.customerName}
            </p>
            <div className="mt-3 pt-3 border-t border-[var(--very-dark-color)]/10">
              <div className="flex justify-between items-center">
                <span className="text-label">Total Amount:</span>
                <span className="text-h5 text-primary">
                  {sale.totalAmount.toLocaleString()} UGX
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-label text-sm mb-2">
              You will be redirected to Flutterwave secure payment page
            </p>
            <p className="text-caption opacity-75 text-xs">
              Customer will complete payment using card, mobile money, or bank transfer
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={onProcessPayment} className="flex-1">
              <CreditCard size={16} className="mr-2" />
              Open Payment Gateway
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}






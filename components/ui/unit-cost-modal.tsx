"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";

interface UnitCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (unitCost: number, currency: string) => void;
  loading?: boolean;
  collectionNumber?: string;
  speciesName?: string;
}

const CURRENCIES: CustomSelectOption[] = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "RWF", label: "RWF - Rwandan Franc" },
  { value: "BIF", label: "BIF - Burundian Franc" },
];

export function UnitCostModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  collectionNumber,
  speciesName,
}: UnitCostModalProps) {
  const [unitCost, setUnitCost] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(unitCost);
    if (isNaN(cost) || cost <= 0) {
      return;
    }
    onConfirm(cost, currency);
  };

  const handleClose = () => {
    if (!loading) {
      setUnitCost("");
      setCurrency("USD");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Determine Unit Cost" size="md">
      <div className="p-6 space-y-4">
        <p className="text-caption opacity-70">
          Set the unit cost for this collection to create an inventory batch with pricing information.
        </p>

        {(collectionNumber || speciesName) && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">
              {collectionNumber && `Collection: ${collectionNumber}`}
              {collectionNumber && speciesName && " • "}
              {speciesName && `Species: ${speciesName}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Currency</div>
            <CustomSelect
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES}
              placeholder="Select currency"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Unit Cost</div>
            <Input
              id="unitCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs opacity-60">
              Cost per unit (per kg, count, or gram depending on collection unit)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="pale" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!unitCost || parseFloat(unitCost) <= 0}
            >
              Approve with Cost
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

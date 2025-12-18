"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle } from "lucide-react";
import type { Sale } from "@/src/models/Sale";

interface SalesListProps {
  sales: Sale[];
  loading: boolean;
  onUpdateStatus?: (saleId: string, status: Sale["paymentStatus"]) => void;
}

export function SalesList({ sales, loading, onUpdateStatus }: SalesListProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-accent/10 text-accent",
      paid: "bg-primary/10 text-primary",
      failed: "bg-red-500/10 text-red-500",
      refunded: "bg-gray-500/10 text-gray-500",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-label">Loading sales...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart size={48} className="mx-auto mb-4 text-[var(--placeholder)]" />
        <p className="text-label mb-2">No orders found</p>
        <p className="text-caption opacity-75">Orders from partners will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => (
        <div
          key={sale.id}
          className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-label font-medium">{sale.species}</h4>
                <Badge className={getStatusColor(sale.paymentStatus)}>
                  {sale.paymentStatus}
                </Badge>
              </div>
              <p className="text-caption opacity-75">
                {sale.saleNumber} • {sale.customerName}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-h5 text-primary">
                {sale.totalAmount.toLocaleString()} UGX
              </p>
              <p className="text-caption opacity-75">
                {sale.quantity} {sale.unit}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-sm mb-4">
            <div>
              <p className="text-caption opacity-75 mb-1">Sale Date</p>
              <p className="text-label">{sale.saleDate}</p>
            </div>
            <div>
              <p className="text-caption opacity-75 mb-1">Price/Unit</p>
              <p className="text-label">
                {sale.pricePerUnit.toLocaleString()} UGX
              </p>
            </div>
            <div>
              <p className="text-caption opacity-75 mb-1">Payment Method</p>
              <p className="text-label capitalize">
                {sale.paymentMethod || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-caption opacity-75 mb-1">Customer</p>
              <p className="text-label">{sale.customerEmail}</p>
            </div>
          </div>
          {sale.transactionReference && (
            <div className="mb-4">
              <p className="text-caption opacity-75">
                Transaction: {sale.transactionReference}
              </p>
            </div>
          )}
          <div className="pt-4 border-t border-[var(--very-dark-color)]/10">
            {onUpdateStatus && (
              <div className="flex gap-2">
                {sale.paymentStatus === "paid" && (
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(sale.id, "paid")}
                    className="flex-1"
                    variant="outline"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Mark as Fulfilled
                  </Button>
                )}
                {sale.paymentStatus === "pending" && (
                  <p className="text-caption opacity-75 text-sm">
                    Waiting for partner to complete payment
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}




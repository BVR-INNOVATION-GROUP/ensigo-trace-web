"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES } from "@/src/models/User";
import { ShoppingCart, DollarSign, Clock, Package, CheckCircle, XCircle, Eye } from "lucide-react";
import { SalesService } from "@/src/services/SalesService";
import { useSales } from "@/src/hooks/useSales";
import { mockNurseries } from "@/src/data/mockData";
import type { Sale } from "@/src/models/Sale";

export default function SalesPage() {
  const { confirm } = useConfirm();
  const myNursery = mockNurseries[0];
  const { sales, stats, loading, loadSales } = useSales(myNursery.id);
  const salesService = new SalesService();

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(s => { counts[s.paymentStatus] = (counts[s.paymentStatus] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [sales]);

  const revenueBySpeciesData = useMemo(() => {
    const revenue: Record<string, number> = {};
    sales.forEach(s => { revenue[s.species] = (revenue[s.species] || 0) + s.totalAmount; });
    return Object.entries(revenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label: label.substring(0, 10), value: Math.round(value / 1000) }));
  }, [sales]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      paid: "bg-green-500/10 text-green-600",
      failed: "bg-red-500/10 text-red-600",
      refunded: "bg-purple-500/10 text-purple-600",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const handleMarkPaid = async (saleId: string) => {
    const confirmed = await confirm({
      title: "Mark as Paid",
      message: "Confirm that payment has been received for this order?",
      type: "success",
      confirmText: "Confirm",
    });
    if (!confirmed) return;

    try {
      await salesService.updatePaymentStatus(saleId, "paid");
      await loadSales();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleMarkFailed = async (saleId: string) => {
    const confirmed = await confirm({
      title: "Mark as Failed",
      message: "Are you sure you want to mark this payment as failed?",
      type: "danger",
      confirmText: "Mark Failed",
    });
    if (!confirmed) return;

    try {
      await salesService.updatePaymentStatus(saleId, "failed");
      await loadSales();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: "saleNumber",
      header: "Order #",
      render: (item) => <span className="font-mono text-primary">{item.saleNumber}</span>,
    },
    { key: "customerName", header: "Customer" },
    { key: "species", header: "Species" },
    {
      key: "quantity",
      header: "Qty",
      render: (item) => `${item.quantity}`,
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (item) => `${item.totalAmount.toLocaleString()} UGX`,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (item) => <Badge className={getStatusColor(item.paymentStatus)}>{item.paymentStatus}</Badge>,
    },
    {
      key: "orderDate",
      header: "Date",
      render: (item) => new Date(item.orderDate).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={NURSERY_ROLES}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-h4 mb-1">Order Management</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              View and manage orders placed by partners
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Orders" value={stats.totalSales} icon={<ShoppingCart size={20} />} index={0} />
            <SummaryCard title="Total Revenue" value={`${(stats.totalRevenue / 1000).toFixed(0)}K UGX`} icon={<DollarSign size={20} />} index={1} />
            <SummaryCard title="Pending Orders" value={stats.pendingPayments} icon={<Clock size={20} />} index={2} />
            <SummaryCard title="Fulfilled Orders" value={stats.paidSales} icon={<Package size={20} />} index={3} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Order Status"
              description="Distribution by payment status"
              type="donut"
              data={statusChartData}
            />
            <ChartCard
              title="Revenue by Species"
              description="Top species by revenue (in thousands)"
              type="bar"
              data={revenueBySpeciesData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={sales}
            columns={columns}
            title="All Orders"
            description="Orders from partners"
            searchable
            searchPlaceholder="Search orders..."
            searchKeys={["saleNumber", "customerName", "species"] as (keyof Sale)[]}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                {item.paymentStatus === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="pale"
                      onClick={() => handleMarkPaid(item.id)}
                      title="Mark Paid"
                    >
                      <CheckCircle size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="pale"
                      onClick={() => handleMarkFailed(item.id)}
                      title="Mark Failed"
                    >
                      <XCircle size={14} />
                    </Button>
                  </>
                )}
                <Button size="sm" variant="pale" title="View Details">
                  <Eye size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No orders yet"
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

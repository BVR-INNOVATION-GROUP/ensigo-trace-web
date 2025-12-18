"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SalesList } from "@/components/dashboard/sales-list";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  Search,
  Package,
} from "lucide-react";
import { SalesService } from "@/src/services/SalesService";
import { useSales } from "@/src/hooks/useSales";
import { mockNurseries } from "@/src/data/mockData";
import type { Sale } from "@/src/models/Sale";

export default function SalesPage() {
  const myNursery = mockNurseries[0];
  const { sales, stats, loading, loadSales } = useSales(myNursery.id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const salesService = new SalesService();

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.species.toLowerCase().includes(search.toLowerCase()) ||
      sale.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sale.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateOrderStatus = async (saleId: string, status: Sale["paymentStatus"]) => {
    try {
      await salesService.updatePaymentStatus(saleId, status);
      await loadSales();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const statsData = [
    {
      title: "Total Orders",
      value: stats.totalSales,
      icon: <ShoppingCart size={18} />,
    },
    {
      title: "Total Revenue",
      value: `${stats.totalRevenue.toLocaleString()} UGX`,
      icon: <DollarSign size={18} />,
    },
    {
      title: "Pending Orders",
      value: stats.pendingPayments,
      icon: <Clock size={18} />,
    },
    {
      title: "Fulfilled Orders",
      value: stats.paidSales,
      icon: <Package size={18} />,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["nursery"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-h4 mb-2">Order Management</h1>
                <p className="text-caption opacity-75">
                  View and manage orders placed by partners. Partners process payments themselves.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <SummaryCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                cardImage={1}
                index={index}
              />
            ))}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                    />
                    <Input
                      placeholder="Search by species, sale number, or customer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "pending", label: "Pending" },
                    { value: "paid", label: "Paid" },
                    { value: "failed", label: "Failed" },
                    { value: "refunded", label: "Refunded" },
                  ]}
                  placeholder="Filter by status"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h5">Orders from Partners</CardTitle>
              <CardDescription>Orders placed by partners who have processed payment</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesList
                sales={filteredSales}
                loading={loading}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

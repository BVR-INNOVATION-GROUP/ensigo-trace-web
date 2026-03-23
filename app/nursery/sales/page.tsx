"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { type UserRole } from "@/src/models/User";
import { ShoppingCart, DollarSign, Clock, Package, CheckCircle, XCircle, Eye, PlusCircle } from "lucide-react";
import { SalesService } from "@/src/services/SalesService";
import { useSales } from "@/src/hooks/useSales";
import api, { type SeedBatch, type Nursery, type User } from "@/src/api/client";
import type { Sale } from "@/src/models/Sale";

export default function SalesPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [user, setUser] = useState<User | null>(null);
  const [myNursery, setMyNursery] = useState<Nursery | null>(null);
  const [batches, setBatches] = useState<SeedBatch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    batchId: "",
    quantity: "",
    pricePerUnit: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "cash" as "flutterwave" | "cash" | "bank_transfer",
    notes: "",
  });
  const { sales, stats, loading, loadSales } = useSales(myNursery?.id || "");
  const salesService = useMemo(() => new SalesService(), []);

  const resolveMyNursery = useCallback(async (currentUser: User & { nursery_id?: string; business_name?: string }) => {
    const typeMap: Record<UserRole, "regional" | "super" | "community"> = {
      regional_nursery: "regional",
      super_nursery: "super",
      community_nursery: "community",
      collector: "community",
      partner: "community",
      admin: "regional",
    };
    const type = typeMap[currentUser.role];
    const result = await api.getNurseries({ type, limit: 500, offset: 0 });
    const rows = result.data || [];
    return (
      rows.find((n) => n.operator_id === currentUser.id) ||
      rows.find((n) => n.id === currentUser.nursery_id || n.nursery_id === currentUser.nursery_id) ||
      rows.find(
        (n) =>
          (n.contact_email && currentUser.email && n.contact_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (n.name && currentUser.business_name && n.name.toLowerCase() === currentUser.business_name.toLowerCase())
      ) ||
      rows.find((n) => n.region && currentUser.region && n.region.toLowerCase() === currentUser.region.toLowerCase()) ||
      (rows.length === 1 ? rows[0] : null)
    );
  }, []);

  const loadContext = useCallback(async () => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const current = JSON.parse(raw) as User & { nursery_id?: string; business_name?: string };
    setUser(current);
    if (current.role !== "community_nursery") {
      router.replace("/dashboard");
      return;
    }
    const nursery = await resolveMyNursery(current);
    setMyNursery(nursery);
    if (!nursery) {
      setBatches([]);
      return;
    }
    const batchRes = await api.getNurseryBatches(nursery.id, { limit: 500, offset: 0 });
    setBatches((batchRes.data || []).filter((b) => Number(b.current_quantity) > 0));
  }, [resolveMyNursery, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext().catch((error) => console.error("Failed to load sales context:", error));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContext]);

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

  const createSale = useCallback(async () => {
    setFormError(null);
    if (!myNursery) {
      setFormError("Nursery not found for your account.");
      return false;
    }
    const selectedBatch = batches.find((b) => b.id === form.batchId);
    if (!selectedBatch) {
      setFormError("Please select a batch.");
      return false;
    }
    const quantity = Number(form.quantity);
    const pricePerUnit = Number(form.pricePerUnit);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity must be greater than zero.");
      return false;
    }
    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
      setFormError("Price per unit must be greater than zero.");
      return false;
    }
    if (quantity > Number(selectedBatch.current_quantity)) {
      setFormError(`Quantity exceeds available stock (${selectedBatch.current_quantity}).`);
      return false;
    }
    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.customerPhone.trim()) {
      setFormError("Customer name, email and phone are required.");
      return false;
    }

    setSaving(true);
    const result = await salesService.createSale({
      batchId: selectedBatch.id,
      species: selectedBatch.species?.scientific_name || selectedBatch.species?.common_name || "Unknown species",
      quantity,
      unit: selectedBatch.unit === "count" ? "seeds" : (selectedBatch.unit as "kg" | "seeds"),
      pricePerUnit,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      paymentMethod: form.paymentMethod,
      saleDate: new Date().toISOString().split("T")[0],
      notes: form.notes.trim() || undefined,
      nurseryId: myNursery.id,
    });
    setSaving(false);

    if (!result.success) {
      setFormError(result.error || "Failed to create sale");
      return false;
    }

    setIsModalOpen(false);
    setForm({
      batchId: "",
      quantity: "",
      pricePerUnit: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentMethod: "cash",
      notes: "",
    });
    await Promise.all([loadSales(), loadContext()]);
    return true;
  }, [myNursery, batches, form, salesService, loadSales, loadContext]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === form.batchId) || null,
    [batches, form.batchId]
  );

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
      key: "saleDate",
      header: "Date",
      render: (item) => new Date(item.saleDate).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["community_nursery"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["community_nursery"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-h4 mb-1">Order Management</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              Record POS sales and manage payment statuses
            </p>
          </div>
          {user?.role === "community_nursery" && (
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(true)} disabled={!myNursery || batches.length === 0}>
                <PlusCircle size={16} className="mr-2" />
                Record Sale
              </Button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Orders" value={stats.totalSales} icon={<ShoppingCart size={20} />} index={0} />
            <SummaryCard title="Total Revenue" value={`${(stats.totalRevenue / 1000).toFixed(2)}K UGX`} icon={<DollarSign size={20} />} index={1} />
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
            searchKeys={["saleNumber", "customerName", "species", "saleDate"] as (keyof Sale)[]}
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

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Sale" size="lg">
            <div className="p-6 space-y-5">
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              {!myNursery && <div className="text-sm text-yellow-700">No nursery linked to your account.</div>}
              {myNursery && batches.length === 0 && (
                <div className="text-sm text-yellow-700">No available inventory batches with stock.</div>
              )}

              <div>
                <label className="text-label block mb-2">Batch *</label>
                <Select
                  value={form.batchId}
                  onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}
                >
                  <option value="">Select inventory batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} - {batch.species?.scientific_name || batch.species?.common_name || "Species"} (
                      {batch.current_quantity} {batch.unit})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedBatch && (
                <div className="rounded-lg border border-[var(--very-dark-color)]/10 p-3 text-sm text-[var(--very-dark-color)]/75">
                  Available: {selectedBatch.current_quantity} {selectedBatch.unit} | Species:{" "}
                  {selectedBatch.species?.scientific_name || selectedBatch.species?.common_name || "N/A"}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label block mb-2">Quantity *</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="text-label block mb-2">Price per unit (UGX) *</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.pricePerUnit}
                    onChange={(e) => setForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))}
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="text-label block mb-2">Payment Method *</label>
                  <Select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value as "flutterwave" | "cash" | "bank_transfer",
                      }))
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="flutterwave">Flutterwave</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label block mb-2">Customer Name *</label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Customer full name"
                  />
                </div>
                <div>
                  <label className="text-label block mb-2">Customer Email *</label>
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-label block mb-2">Customer Phone *</label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="+2567..."
                />
              </div>

              <div>
                <label className="text-label block mb-2">Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="pale" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void createSale()} disabled={saving}>
                  {saving ? "Saving..." : "Save Sale"}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

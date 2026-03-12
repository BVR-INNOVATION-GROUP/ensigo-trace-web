"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Package, TrendingUp, AlertCircle, Edit, CheckCircle, Inbox, Trash2 } from "lucide-react";
import { mockNurseries, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES } from "@/src/models/User";
import type { SeedBatch } from "@/src/data/mockData";

export default function InventoryPage() {
  const { confirm } = useConfirm();
  const myNursery = mockNurseries[0];
  const [batches, setBatches] = useState(
    mockSeedBatches.filter((b) => b.nurseryId === myNursery.id)
  );
  const [availableBatches] = useState(
    mockSeedBatches.filter((b) => b.status === "approved" && !b.nurseryId)
  );
  const [selectedBatch, setSelectedBatch] = useState<SeedBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [formData, setFormData] = useState({ status: "", quantity: "", notes: "" });
  const [receiveFormData, setReceiveFormData] = useState({ quantity: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const lowStockCount = batches.filter((b) => b.quantity < 500).length;
  const speciesCount = new Set(batches.map((b) => b.species)).size;

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    batches.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({ label: label.replace("-", " "), value }));
  }, [batches]);

  const speciesChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    batches.forEach(b => { counts[b.species] = (counts[b.species] || 0) + b.quantity; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label: label.substring(0, 12), value }));
  }, [batches]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      approved: "bg-primary/10 text-primary",
      "in-nursery": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      distributed: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      planted: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const handleOpenModal = (batch: SeedBatch) => {
    setSelectedBatch(batch);
    setFormData({ status: batch.status, quantity: batch.quantity.toString(), notes: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBatch(null);
  };

  const handleOpenReceiveModal = (batch: SeedBatch) => {
    setSelectedBatch(batch);
    setReceiveFormData({ quantity: batch.quantity.toString(), notes: "" });
    setIsReceiveModalOpen(true);
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    setSelectedBatch(null);
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const quantity = parseFloat(receiveFormData.quantity);
    const newBatch: SeedBatch = { ...selectedBatch, status: "in-nursery", nurseryId: myNursery.id, quantity };
    setBatches((prev) => [...prev, newBatch]);
    setIsSubmitting(false);
    handleCloseReceiveModal();
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const quantity = parseFloat(formData.quantity);
    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id ? { ...b, status: formData.status as SeedBatch["status"], quantity } : b
      )
    );
    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Remove from Inventory",
      message: "Are you sure you want to remove this batch from your inventory?",
      type: "danger",
      confirmText: "Remove",
    });
    if (!confirmed) return;
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const columns: Column<SeedBatch>[] = [
    {
      key: "batchNumber",
      header: "Batch #",
      render: (item) => <span className="font-mono text-primary">{item.batchNumber}</span>,
    },
    { key: "species", header: "Species" },
    {
      key: "quantity",
      header: "Quantity",
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <Badge className={getStatusColor(item.status)}>{item.status.replace("-", " ")}</Badge>,
    },
    {
      key: "germinationRate",
      header: "Germination",
      render: (item) => item.germinationRate ? `${item.germinationRate}%` : "N/A",
    },
    {
      key: "collectionDate",
      header: "Date",
      render: (item) => new Date(item.collectionDate).toLocaleDateString(),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6 min-h-[120px] sm:min-h-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-h4 mb-1">Inventory Management</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Track and manage all seed batches in your nursery
              </p>
            </div>
            {availableBatches.length > 0 && (
              <Button onClick={() => setIsReceiveModalOpen(true)} className="min-h-[44px] justify-center sm:justify-start sm:flex-shrink-0">
                <Inbox size={16} className="mr-2" />
                Receive Inventory ({availableBatches.length})
              </Button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard title="Total Batches" value={batches.length} icon={<Package size={20} />} index={0} />
            <SummaryCard title="Species Diversity" value={speciesCount} icon={<TrendingUp size={20} />} index={1} />
            <SummaryCard title="Low Stock Alert" value={lowStockCount} icon={<AlertCircle size={20} />} index={2} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Status Distribution" description="Batches by current status" type="donut" data={statusChartData} />
            <ChartCard title="Quantity by Species" description="Stock levels per species" type="bar" data={speciesChartData} />
          </div>

          {/* Available to Receive */}
          {availableBatches.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-h5">Available to Receive</CardTitle>
                    <CardDescription>Approved batches ready for your nursery</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary">{availableBatches.length} batches</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableBatches.slice(0, 3).map((batch) => (
                    <div key={batch.id} className="p-3 border border-primary/20 rounded-lg bg-paper flex items-center justify-between">
                      <div>
                        <p className="text-label font-medium">{batch.species}</p>
                        <p className="text-caption text-[var(--very-dark-color)]/60">
                          Batch {batch.batchNumber} • {batch.quantity} {batch.unit}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleOpenReceiveModal(batch)}>
                        <Inbox size={14} className="mr-2" />
                        Receive
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <DataTable
            data={batches}
            columns={columns}
            title="Batch Inventory"
            description="Complete list of all seed batches in stock"
            searchable
            searchPlaceholder="Search batches..."
            searchKeys={["batchNumber", "species"] as (keyof SeedBatch)[]}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="pale" onClick={() => handleOpenModal(item)} title="Edit">
                  <Edit size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => handleDelete(item.id)} title="Remove">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No batches in inventory"
          />

          {/* Receive Modal */}
          <Modal isOpen={isReceiveModalOpen} onClose={handleCloseReceiveModal} title="Receive Inventory" size="md">
            <div className="p-6">
              {selectedBatch ? (
                <form onSubmit={handleReceiveBatch} className="space-y-6">
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-label font-medium">{selectedBatch.species}</p>
                    <p className="text-caption text-[var(--very-dark-color)]/60">
                      Batch {selectedBatch.batchNumber} • Original: {selectedBatch.quantity} {selectedBatch.unit}
                    </p>
                  </div>
                  <div>
                    <label className="block text-label mb-2">Received Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter received quantity"
                      value={receiveFormData.quantity}
                      onChange={(e) => setReceiveFormData({ ...receiveFormData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-2">Notes</label>
                    <Textarea
                      placeholder="Any notes about condition..."
                      value={receiveFormData.notes}
                      onChange={(e) => setReceiveFormData({ ...receiveFormData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <Button type="button" variant="pale" onClick={handleCloseReceiveModal} className="flex-1" disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={isSubmitting}>Receive</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  {availableBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 cursor-pointer"
                      onClick={() => handleOpenReceiveModal(batch)}
                    >
                      <p className="text-label font-medium">{batch.species}</p>
                      <p className="text-caption text-[var(--very-dark-color)]/60">
                        Batch {batch.batchNumber} • {batch.quantity} {batch.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>

          {/* Update Modal */}
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Update Batch" size="md">
            <div className="p-6">
              {selectedBatch && (
                <form onSubmit={handleSubmitUpdate} className="space-y-6">
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-label font-medium">{selectedBatch.species}</p>
                    <p className="text-caption text-[var(--very-dark-color)]/60">Batch {selectedBatch.batchNumber}</p>
                  </div>
                  <div>
                    <label className="block text-label mb-2">Status *</label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value })}
                      options={[
                        { value: "in-nursery", label: "In Nursery" },
                        { value: "distributed", label: "Distributed" },
                        { value: "planted", label: "Planted" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-2">Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-2">Notes</label>
                    <Textarea
                      placeholder="Add notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <Button type="button" variant="pale" onClick={handleCloseModal} className="flex-1" disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={isSubmitting}>Update</Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

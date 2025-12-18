"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Search, Package, TrendingUp, AlertCircle, Edit, CheckCircle, Plus, Inbox } from "lucide-react";
import { mockNurseries, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { motion } from "framer-motion";
import type { SeedBatch } from "@/src/data/mockData";

export default function InventoryPage() {
  const myNursery = mockNurseries[0];
  const [allBatches] = useState(mockSeedBatches);
  const [batches, setBatches] = useState(
    mockSeedBatches.filter((b) => b.nurseryId === myNursery.id)
  );
  const [availableBatches] = useState(
    mockSeedBatches.filter((b) => b.status === "approved" && !b.nurseryId)
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<SeedBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    quantity: "",
    notes: "",
  });
  const [receiveFormData, setReceiveFormData] = useState({
    quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.species.toLowerCase().includes(search.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (batch: SeedBatch) => {
    setSelectedBatch(batch);
    setFormData({
      status: batch.status,
      quantity: batch.quantity.toString(),
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBatch(null);
    setFormData({ status: "", quantity: "", notes: "" });
  };

  const handleOpenReceiveModal = (batch: SeedBatch) => {
    setSelectedBatch(batch);
    setReceiveFormData({
      quantity: batch.quantity.toString(),
      notes: "",
    });
    setIsReceiveModalOpen(true);
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    setSelectedBatch(null);
    setReceiveFormData({ quantity: "", notes: "" });
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const quantity = parseFloat(receiveFormData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      alert("Please enter a valid quantity");
      setIsSubmitting(false);
      return;
    }

    // Add batch to nursery inventory
    const newBatch: SeedBatch = {
      ...selectedBatch,
      status: "in-nursery",
      nurseryId: myNursery.id,
      quantity,
    };

    setBatches((prev) => [...prev, newBatch]);
    setIsSubmitting(false);
    handleCloseReceiveModal();
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      alert("Please enter a valid quantity");
      setIsSubmitting(false);
      return;
    }

    // Update batch in state
    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id
          ? {
              ...b,
              status: formData.status as SeedBatch["status"],
              quantity,
            }
          : b
      )
    );

    setIsSubmitting(false);
    handleCloseModal();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-accent/10 text-accent",
      approved: "bg-primary/10 text-primary",
      "in-nursery": "bg-chart-4/10 text-chart-4",
      distributed: "bg-chart-3/10 text-chart-3",
      planted: "bg-success/10 text-success",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const stats = [
    {
      title: "Total Batches",
      value: batches.length,
      icon: <Package size={18} />,
    },
    {
      title: "Species Diversity",
      value: new Set(batches.map((b) => b.species)).size,
      icon: <TrendingUp size={18} />,
    },
    {
      title: "Low Stock Alert",
      value: batches.filter((b) => b.quantity < 500).length,
      icon: <AlertCircle size={18} />,
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
                <h1 className="text-h4 mb-2">Inventory Management</h1>
                <p className="text-caption opacity-75">
                  Track and manage all seed batches in your nursery
                </p>
              </div>
              {availableBatches.length > 0 && (
                <Button onClick={() => setIsReceiveModalOpen(true)}>
                  <Inbox size={16} className="mr-2" />
                  Receive Inventory ({availableBatches.length})
                </Button>
              )}
            </div>
            <div className="p-4 bg-pale rounded-lg border border-[var(--very-dark-color)]/10">
              <p className="text-label font-medium mb-2">How Inventory is Recorded:</p>
              <ol className="list-decimal list-inside space-y-1 text-body-sm opacity-75">
                <li>Collectors submit seed collections which are reviewed by admins</li>
                <li>Once approved, batches appear in "Available to Receive" section</li>
                <li>Nursery operators receive batches by recording actual quantity received (with min/max validation)</li>
                <li>Batches are then tracked in your inventory with status updates</li>
                <li>You can update quantities and status as batches progress through the nursery</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
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
                      placeholder="Search by species or batch number..."
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
                    { value: "approved", label: "Approved" },
                    { value: "in-nursery", label: "In Nursery" },
                    { value: "distributed", label: "Distributed" },
                  ]}
                  placeholder="Filter by status"
                />
              </div>
            </CardContent>
          </Card>

          {availableBatches.length > 0 && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-h5">Available to Receive</CardTitle>
                    <CardDescription>
                      Approved batches ready to be received into your nursery
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {availableBatches.length} batches
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableBatches.slice(0, 3).map((batch) => (
                    <div
                      key={batch.id}
                      className="p-3 border border-primary/20 rounded-lg bg-paper"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-label font-medium">{batch.species}</p>
                          <p className="text-caption opacity-75">
                            Batch {batch.batchNumber} • {batch.quantity} {batch.unit} • {batch.collectorName}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenReceiveModal(batch)}
                        >
                          <Inbox size={14} className="mr-2" />
                          Receive
                        </Button>
                      </div>
                    </div>
                  ))}
                  {availableBatches.length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsReceiveModalOpen(true)}
                    >
                      View All {availableBatches.length} Available Batches
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-h5">Batch Inventory</CardTitle>
              <CardDescription>Complete list of all seed batches in stock</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto mb-4 text-[var(--placeholder)]" />
                  <p className="text-label mb-2">No batches in inventory</p>
                  <p className="text-caption opacity-75 mb-4">
                    {availableBatches.length > 0
                      ? "Receive approved batches to add them to your inventory"
                      : "No batches available at the moment"}
                  </p>
                  {availableBatches.length > 0 && (
                    <Button onClick={() => setIsReceiveModalOpen(true)}>
                      <Inbox size={16} className="mr-2" />
                      Receive Inventory
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-label font-medium">{batch.species}</h4>
                            <Badge className={getStatusColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </div>
                          <p className="text-caption opacity-75">Batch {batch.batchNumber}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-h5 text-primary">{batch.quantity}</p>
                          <p className="text-caption opacity-75">{batch.unit}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-sm mb-4">
                        <div>
                          <p className="text-caption opacity-75 mb-1">Collection Date</p>
                          <p className="text-label">{batch.collectionDate}</p>
                        </div>
                        <div>
                          <p className="text-caption opacity-75 mb-1">Mother Tree</p>
                          <p className="text-label">{batch.motherTreeId}</p>
                        </div>
                        {batch.germinationRate && (
                          <div>
                            <p className="text-caption opacity-75 mb-1">Germination</p>
                            <p className="text-label text-primary">{batch.germinationRate}%</p>
                          </div>
                        )}
                        <div>
                          <p className="text-caption opacity-75 mb-1">Region</p>
                          <p className="text-label">{batch.region}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-[var(--very-dark-color)]/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(batch)}
                          className="w-full"
                        >
                          <Edit size={14} className="mr-2" />
                          Update Batch
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receive Inventory Modal */}
          <Modal
            isOpen={isReceiveModalOpen}
            onClose={handleCloseReceiveModal}
            title="Receive Inventory"
            size="lg"
          >
            <div className="p-6">
              {selectedBatch ? (
                <form onSubmit={handleReceiveBatch} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-caption opacity-75">Batch Information</p>
                    <div className="p-4 bg-pale rounded-lg">
                      <p className="text-label font-medium">{selectedBatch.species}</p>
                      <p className="text-caption opacity-75">
                        Batch {selectedBatch.batchNumber} • Collected by {selectedBatch.collectorName}
                      </p>
                      <p className="text-caption opacity-75 mt-1">
                        Original Quantity: {selectedBatch.quantity} {selectedBatch.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Received Quantity ({selectedBatch.unit}) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max={Math.max(selectedBatch.quantity * 1.1, selectedBatch.quantity)}
                        step={selectedBatch.unit === "kg" ? "0.01" : "1"}
                        placeholder={`Enter received quantity in ${selectedBatch.unit}`}
                        value={receiveFormData.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          const maxValue = Math.max(selectedBatch.quantity * 1.1, selectedBatch.quantity);
                          if (value === "" || (numValue >= 0 && numValue <= maxValue)) {
                            setReceiveFormData({ ...receiveFormData, quantity: value });
                          }
                        }}
                        required
                      />
                      <div className="flex items-center justify-between text-caption opacity-75">
                        <span>Min: 0 {selectedBatch.unit}</span>
                        <span>Max: {Math.max(selectedBatch.quantity * 1.1, selectedBatch.quantity).toFixed(selectedBatch.unit === "kg" ? 2 : 0)} {selectedBatch.unit} (110% of original)</span>
                      </div>
                    </div>
                    <p className="text-caption opacity-75">
                      Enter the actual quantity received. Original: {selectedBatch.quantity} {selectedBatch.unit}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">Receiving Notes</label>
                    <Textarea
                      placeholder="Add notes about condition, quality, or any issues observed..."
                      value={receiveFormData.notes}
                      onChange={(e) =>
                        setReceiveFormData({ ...receiveFormData, notes: e.target.value })
                      }
                      rows={3}
                    />
                    <p className="text-caption opacity-75">
                      Optional notes about batch condition upon receipt
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseReceiveModal}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Receiving..."
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Receive into Inventory
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-label mb-4">Select a batch to receive:</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 cursor-pointer"
                        onClick={() => handleOpenReceiveModal(batch)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-label font-medium">{batch.species}</p>
                            <p className="text-caption opacity-75">
                              Batch {batch.batchNumber} • {batch.quantity} {batch.unit} • {batch.collectorName}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Inbox size={14} className="mr-2" />
                            Receive
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* Update Batch Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Update Batch Information"
            size="md"
          >
            <div className="p-6">
              {selectedBatch && (
                <form onSubmit={handleSubmitUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-caption opacity-75">Batch Information</p>
                    <div className="p-4 bg-pale rounded-lg">
                      <p className="text-label font-medium">{selectedBatch.species}</p>
                      <p className="text-caption opacity-75">
                        Batch {selectedBatch.batchNumber} • {selectedBatch.collectorName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "approved", label: "Approved" },
                        { value: "in-nursery", label: "In Nursery" },
                        { value: "distributed", label: "Distributed" },
                        { value: "planted", label: "Planted" },
                      ]}
                      placeholder="Select status"
                    />
                    <p className="text-caption opacity-75">
                      Update the current status of this batch
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Current Quantity ({selectedBatch.unit}) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max={Math.max(selectedBatch.quantity * 2, 10000)}
                        step={selectedBatch.unit === "kg" ? "0.01" : "1"}
                        placeholder={`Enter quantity in ${selectedBatch.unit}`}
                        value={formData.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          const maxValue = Math.max(selectedBatch.quantity * 2, 10000);
                          if (value === "" || (numValue >= 0 && numValue <= maxValue)) {
                            setFormData({ ...formData, quantity: value });
                          }
                        }}
                        required
                      />
                      <div className="flex items-center justify-between text-caption opacity-75">
                        <span>Min: 0 {selectedBatch.unit}</span>
                        <span>Max: {Math.max(selectedBatch.quantity * 2, 10000).toLocaleString()} {selectedBatch.unit}</span>
                      </div>
                    </div>
                    <p className="text-caption opacity-75">
                      Update the current stock quantity for this batch
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">Notes</label>
                    <Textarea
                      placeholder="Add any notes or observations about this batch..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                    />
                    <p className="text-caption opacity-75">
                      Optional notes about batch condition, issues, or observations
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Saving..."
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Update Batch
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


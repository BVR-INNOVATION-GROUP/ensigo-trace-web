"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { CheckCircle, XCircle, Search, Plus } from "lucide-react";
import { mockSeedBatches, type SeedBatch } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";

export default function SeedBatchesPage() {
  const [batches, setBatches] = useState(mockSeedBatches);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: "",
    species: "",
    quantity: "",
    unit: "kg" as "kg" | "seeds",
    collectorName: "",
    collectionDate: "",
    motherTreeId: "",
    region: "",
    latitude: "",
    longitude: "",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const filteredBatches = batches.filter((batch) => {
    const matchesFilter = filter === "all" || batch.status === filter;
    const matchesSearch =
      batch.species.toLowerCase().includes(search.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      batch.collectorName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenModal = () => {
    setFormData({
      batchNumber: "",
      species: "",
      quantity: "",
      unit: "kg",
      collectorName: "",
      collectionDate: "",
      motherTreeId: "",
      region: "",
      latitude: "",
      longitude: "",
      status: "pending",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      batchNumber: "",
      species: "",
      quantity: "",
      unit: "kg",
      collectorName: "",
      collectionDate: "",
      motherTreeId: "",
      region: "",
      latitude: "",
      longitude: "",
      status: "pending",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newBatch: SeedBatch = {
      id: `SB-${String(batches.length + 1).padStart(3, "0")}`,
      batchNumber: formData.batchNumber,
      species: formData.species,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      collectorName: formData.collectorName,
      collectionDate: formData.collectionDate,
      motherTreeId: formData.motherTreeId,
      region: formData.region,
      status: formData.status as SeedBatch["status"],
      gpsCoordinates: {
        lat: parseFloat(formData.latitude) || 0,
        lng: parseFloat(formData.longitude) || 0,
      },
    };

    setBatches([...batches, newBatch]);
    setIsSubmitting(false);
    handleCloseModal();
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-h4 mb-2">Seed Batch Management</h1>
              <p className="text-caption opacity-75">
                Review, validate, and track all seed collection batches
              </p>
            </div>
            <Button onClick={handleOpenModal}>
              <Plus size={16} className="mr-2" />
              Create Batch
            </Button>
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
                      placeholder="Search by species, batch number, or collector..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <CustomSelect
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "in-nursery", label: "In Nursery" },
                    { value: "distributed", label: "Distributed" },
                    { value: "planted", label: "Planted" },
                  ]}
                  placeholder="Filter by status"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {filteredBatches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-h5">{batch.batchNumber}</CardTitle>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status}
                        </Badge>
                      </div>
                      <CardDescription>{batch.species}</CardDescription>
                    </div>
                    {batch.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle size={16} className="mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-caption opacity-75 mb-1">Quantity</p>
                      <p className="text-label">
                        {batch.quantity} {batch.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption opacity-75 mb-1">Collector</p>
                      <p className="text-label">{batch.collectorName}</p>
                    </div>
                    <div>
                      <p className="text-caption opacity-75 mb-1">Collection Date</p>
                      <p className="text-label">{batch.collectionDate}</p>
                    </div>
                    <div>
                      <p className="text-caption opacity-75 mb-1">Region</p>
                      <p className="text-label">{batch.region}</p>
                    </div>
                    {batch.germinationRate && (
                      <div>
                        <p className="text-caption opacity-75 mb-1">Germination Rate</p>
                        <p className="text-label text-primary">{batch.germinationRate}%</p>
                      </div>
                    )}
                    <div>
                      <p className="text-caption opacity-75 mb-1">Mother Tree ID</p>
                      <p className="text-label">{batch.motherTreeId}</p>
                    </div>
                    <div>
                      <p className="text-caption opacity-75 mb-1">GPS Coordinates</p>
                      <p className="text-label text-xs">
                        {batch.gpsCoordinates.lat.toFixed(4)}, {batch.gpsCoordinates.lng.toFixed(4)}
                      </p>
                    </div>
                    {batch.nurseryId && (
                      <div>
                        <p className="text-caption opacity-75 mb-1">Nursery</p>
                        <p className="text-label">{batch.nurseryId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBatches.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-caption opacity-75">
                  No batches found matching your criteria.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Create Batch Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Create New Batch"
            size="lg"
          >
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Batch Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., ENS-WN-001"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Species <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter species name"
                      value={formData.species}
                      onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={formData.unit === "kg" ? "0.01" : "1"}
                      placeholder="Enter quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-paper border border-[var(--very-dark-color)]/10 rounded-md text-label"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as "kg" | "seeds" })}
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="seeds">seeds</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Collector Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter collector name"
                      value={formData.collectorName}
                      onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Collection Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.collectionDate}
                      onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Mother Tree ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., MT-001"
                      value={formData.motherTreeId}
                      onChange={(e) => setFormData({ ...formData, motherTreeId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., West Nile - Arua"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">Latitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="GPS Latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">Longitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="GPS Longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-paper border border-[var(--very-dark-color)]/10 rounded-md text-label"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in-nursery">In Nursery</option>
                    <option value="distributed">Distributed</option>
                    <option value="planted">Planted</option>
                  </select>
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
                      "Creating..."
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Create Batch
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


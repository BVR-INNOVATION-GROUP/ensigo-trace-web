"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Plus, Database, Clock, Package, Edit, Trash2, Undo2, MapPin, Map } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RegionDistrictSelect, RegionMapModal } from "@/components/geo";
import api, { SeedCollection, CreateCollectionRequest } from "@/src/api/client";

export default function SeedBatchesPage() {
  const { confirm } = useConfirm();
  const [batches, setBatches] = useState<SeedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    species_name: "",
    quantity: "",
    unit: "kg",
    region: "",
    district: "",
    village: "",
    latitude: "",
    longitude: "",
    additional_info: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<SeedCollection | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllCollections({ limit: 100 });
      setBatches(response.data);
    } catch (err) {
      console.error("Failed to load batches:", err);
      setError("Failed to load seed batches.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalBatches = batches.length;
    const pendingCount = batches.filter(b => b.status === "pending").length;
    const approvedCount = batches.filter(b => b.status === "approved" || b.status === "in_nursery").length;
    const totalQuantity = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    return { totalBatches, pendingCount, approvedCount, totalQuantity };
  }, [batches]);

  // Chart data
  const statusChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    batches.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([label, value]) => ({ label: label.replace("_", " "), value }));
  }, [batches]);

  const speciesChartData = useMemo(() => {
    const speciesCounts: Record<string, number> = {};
    batches.forEach(b => {
      const name = b.species?.common_name || b.species_name || "Unknown";
      speciesCounts[name] = (speciesCounts[name] || 0) + 1;
    });
    return Object.entries(speciesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [batches]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      approved: "bg-primary/10 text-primary",
      in_nursery: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      distributed: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      planted: "bg-green-500/10 text-green-600 dark:text-green-400",
      rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      await api.updateCollection(id, { status: "approved" });
      await loadBatches();
    } catch (err) {
      console.error("Failed to approve collection:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setRejectingId(id);
      await api.updateCollection(id, { status: "rejected" });
      await loadBatches();
    } catch (err) {
      console.error("Failed to reject collection:", err);
    } finally {
      setRejectingId(null);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      species_name: "",
      quantity: "",
      unit: "kg",
      region: "",
      district: "",
      village: "",
      latitude: "",
      longitude: "",
      additional_info: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const request: CreateCollectionRequest = {
        species_name: formData.species_name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit as "kg" | "count" | "g",
        region: formData.region,
        district: formData.district,
        village: formData.village,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        additional_info: formData.additional_info,
      };
      await api.createCollection(request);
      await loadBatches();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create collection:", err);
      setError("Failed to create seed collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeapprove = async (id: string) => {
    const confirmed = await confirm({
      title: "Revert to Pending",
      message: "Are you sure you want to revert this batch to pending status? This will require re-approval.",
      type: "warning",
      confirmText: "Revert",
    });
    if (!confirmed) return;

    try {
      setRejectingId(id);
      await api.updateCollection(id, { status: "pending" });
      await loadBatches();
    } catch (err) {
      console.error("Failed to deapprove collection:", err);
    } finally {
      setRejectingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Batch",
      message: "Are you sure you want to delete this seed batch? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    // Optimistic UI update - remove from state immediately
    setBatches(prev => prev.filter(b => b.id !== id));

    try {
      await api.deleteCollection(id);
    } catch (err) {
      console.error("Failed to delete collection:", err);
      // Revert on error by reloading
      await loadBatches();
    }
  };

  const handleRejectWithConfirm = async (id: string) => {
    const confirmed = await confirm({
      title: "Reject Batch",
      message: "Are you sure you want to reject this seed collection? The collector will be notified.",
      type: "warning",
      confirmText: "Reject",
    });
    if (!confirmed) return;
    handleReject(id);
  };

  const handleEdit = (batch: SeedCollection) => {
    setEditingBatch(batch);
    setFormData({
      species_name: batch.species?.scientific_name || batch.species_name || "",
      quantity: batch.quantity.toString(),
      unit: batch.unit || "kg",
      region: batch.region || "",
      district: batch.district || "",
      village: batch.village || "",
      latitude: batch.latitude?.toString() || "",
      longitude: batch.longitude?.toString() || "",
      additional_info: batch.additional_info || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setIsSubmitting(true);
    try {
      await api.updateCollection(editingBatch.id, {
        status: editingBatch.status,
        review_notes: formData.additional_info,
        quality_rating: editingBatch.quality_rating,
      });
      await loadBatches();
      setIsEditModalOpen(false);
      setEditingBatch(null);
    } catch (err) {
      console.error("Failed to update collection:", err);
      setError("Failed to update collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBatch(null);
  };

  const columns: Column<SeedCollection>[] = [
    {
      key: "collection_number",
      header: "Batch #",
      render: (item) => (
        <span className="font-mono text-primary">{item.collection_number || item.batch_number}</span>
      ),
    },
    {
      key: "species_name",
      header: "Species",
      render: (item) => item.species?.scientific_name || item.species_name || "Unknown",
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "collector",
      header: "Collector",
      render: (item) => item.collector?.name || "Unknown",
    },
    {
      key: "region",
      header: "Region",
    },
    {
      key: "collection_date",
      header: "Date",
      render: (item) => new Date(item.collection_date).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge className={getStatusColor(item.status)}>
          {item.status.replace("_", " ")}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header - taller on mobile, stacks for small screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6 min-h-[120px] sm:min-h-0">
            <div className="min-w-0 flex-shrink-0">
              <h1 className="text-xl sm:text-h4 mb-1">Seed Batch Management</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Review, validate, and track all seed collection batches
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
              <Button variant="pale" onClick={() => setIsMapModalOpen(true)} className="min-h-[44px] justify-center sm:justify-start">
                <Map size={16} className="mr-2 flex-shrink-0" />
                Regions Map
              </Button>
              <Button onClick={handleOpenModal} className="min-h-[44px] justify-center sm:justify-start">
                <Plus size={16} className="mr-2 flex-shrink-0" />
                Create Collection
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={loadBatches} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Batches"
              value={stats.totalBatches}
              icon={<Database size={20} />}
              index={0}
            />
            <SummaryCard
              title="Pending Review"
              value={stats.pendingCount}
              icon={<Clock size={20} />}
              index={1}
            />
            <SummaryCard
              title="Approved"
              value={stats.approvedCount}
              icon={<CheckCircle size={20} />}
              index={2}
            />
            <SummaryCard
              title="Total Quantity"
              value={`${stats.totalQuantity.toFixed(1)} kg`}
              icon={<Package size={20} />}
              index={3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Status Distribution"
              description="Batches by current status"
              type="donut"
              data={statusChartData}
            />
            <ChartCard
              title="Top Species"
              description="Most collected species"
              type="bar"
              data={speciesChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={batches}
            columns={columns}
            title="All Seed Batches"
            description="Click on actions to approve or reject pending batches"
            searchable
            searchPlaceholder="Search batches..."
            searchKeys={["collection_number", "species_name", "region"] as (keyof SeedCollection)[]}
            actions={(item) => (
              <div className="flex gap-2 justify-end">
                {item.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="pale"
                      onClick={() => handleApprove(item.id)}
                      loading={approvingId === item.id}
                      disabled={approvingId === item.id || rejectingId === item.id}
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="pale"
                      onClick={() => handleRejectWithConfirm(item.id)}
                      loading={rejectingId === item.id}
                      disabled={approvingId === item.id || rejectingId === item.id}
                      title="Reject"
                    >
                      <XCircle size={14} />
                    </Button>
                  </>
                )}
                {(item.status === "approved" || item.status === "in_nursery" || item.status === "rejected") && (
                  <Button
                    size="sm"
                    variant="pale"
                    onClick={() => handleDeapprove(item.id)}
                    loading={rejectingId === item.id}
                    title="Revert to Pending"
                  >
                    <Undo2 size={14} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="pale"
                  onClick={() => handleEdit(item)}
                  title="Edit"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="pale"
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No seed batches found"
          />

          {/* Create Collection Modal */}
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Collection" size="xl">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label mb-3">Species Name *</label>
                    <Input
                      placeholder="Enter species name"
                      value={formData.species_name}
                      onChange={(e) => setFormData({ ...formData, species_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-3">Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-label mb-3">Unit *</label>
                  <CustomSelect
                    value={formData.unit}
                    onChange={(value) => setFormData({ ...formData, unit: value })}
                    options={[
                      { value: "kg", label: "Kilograms (kg)" },
                      { value: "g", label: "Grams (g)" },
                      { value: "count", label: "Count" },
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-label mb-3">
                    <MapPin size={16} />
                    Collection Location
                  </label>
                  <RegionDistrictSelect
                    region={formData.region}
                    district={formData.district}
                    village={formData.village}
                    onRegionChange={(value) => setFormData({ ...formData, region: value })}
                    onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                    onVillageChange={(value) => setFormData({ ...formData, village: value })}
                    showVillage={true}
                    layout="vertical"
                  />
                </div>
                <div>
                  <label className="block text-label mb-3">Additional Info</label>
                  <Input
                    placeholder="Any additional information"
                    value={formData.additional_info}
                    onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-[var(--very-dark-color)]/10">
                  <Button type="button" variant="pale" onClick={handleCloseModal} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Create Collection
                  </Button>
                </div>
              </form>
            </div>
          </Modal>

          {/* Region Map Modal */}
          <RegionMapModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            collections={batches}
          />

          {/* Edit Collection Modal */}
          <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Collection" size="xl">
            <div className="p-8">
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label mb-3">Species Name</label>
                    <Input
                      placeholder="Species name"
                      value={formData.species_name}
                      onChange={(e) => setFormData({ ...formData, species_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-3">Quantity</label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label mb-3">Unit</label>
                    <CustomSelect
                      value={formData.unit}
                      onChange={(value) => setFormData({ ...formData, unit: value })}
                      options={[
                        { value: "kg", label: "Kilograms (kg)" },
                        { value: "g", label: "Grams (g)" },
                        { value: "count", label: "Count" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-3">Status</label>
                    <CustomSelect
                      value={editingBatch?.status || "pending"}
                      onChange={(value) => setEditingBatch(prev => prev ? { ...prev, status: value as SeedCollection["status"] } : null)}
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "approved", label: "Approved" },
                        { value: "rejected", label: "Rejected" },
                        { value: "in_nursery", label: "In Nursery" },
                        { value: "distributed", label: "Distributed" },
                        { value: "planted", label: "Planted" },
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-label mb-3">
                    <MapPin size={16} />
                    Location
                  </label>
                  <RegionDistrictSelect
                    region={formData.region}
                    district={formData.district}
                    village={formData.village}
                    onRegionChange={(value) => setFormData({ ...formData, region: value })}
                    onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                    onVillageChange={(value) => setFormData({ ...formData, village: value })}
                    showVillage={true}
                    layout="vertical"
                  />
                </div>
                <div>
                  <label className="block text-label mb-3">Notes</label>
                  <Input
                    placeholder="Review notes or additional information"
                    value={formData.additional_info}
                    onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-[var(--very-dark-color)]/10">
                  <Button type="button" variant="pale" onClick={handleCloseEditModal} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

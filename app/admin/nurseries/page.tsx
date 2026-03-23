"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { NurseryLocationsMap } from "@/components/dashboard/nursery-locations-map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Sprout, Plus, CheckCircle, Building2, Edit, Trash2, Eye, CheckCircle2, Clock } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { reverseGeocode, getCurrentLocationWithAddress, type GeoSearchResult } from "@/components/geo";
import {
  RegionalNurseryFormGrid,
  emptyRegionalNurseryForm,
  type RegionalNurseryFormState,
} from "@/components/nursery/regional-nursery-form-grid";
import api, { Nursery, CreateNurseryRequest, NurseryStats, UpdateNurseryRequest } from "@/src/api/client";

export default function NurseriesPage() {
  const { confirm } = useConfirm();
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [approvingNurseryId, setApprovingNurseryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNursery, setSelectedNursery] = useState<Nursery | null>(null);
  const [viewNurseryDetails, setViewNurseryDetails] = useState<Nursery | null>(null);
  const [viewNurseryStats, setViewNurseryStats] = useState<NurseryStats | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<RegionalNurseryFormState>(emptyRegionalNurseryForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadNurseryNetwork();
  }, []);

  const loadNurseryNetwork = async () => {
    try {
      setLoading(true);
      setError(null);
      const nurseryRes = await api.getAllNurseries({ limit: 200 });
      setNurseries(nurseryRes.data);
    } catch (err) {
      console.error("Failed to load nurseries:", err);
      setError("Failed to load nurseries.");
    } finally {
      setLoading(false);
    }
  };

  const reloadNurseries = async () => {
    await loadNurseryNetwork();
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = nurseries.length;
    const totalStock = nurseries.reduce((sum, n) => sum + (n.current_stock || 0), 0);
    const verifiedCount = nurseries.filter((n) => n.is_verified).length;
    const pendingCount = nurseries.filter((n) => !n.is_verified).length;
    return { total, totalStock, verifiedCount, pendingCount };
  }, [nurseries]);

  const handleApproveNursery = async (nursery: Nursery) => {
    setApprovingNurseryId(nursery.id);
    try {
      const updated = await api.approveNursery(nursery.id);
      setError(null);
      setNurseries((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      console.error("Failed to approve nursery:", err);
      setError("Failed to approve nursery. Try again.");
    } finally {
      setApprovingNurseryId(null);
    }
  };

  // Chart data
  const typeChartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    nurseries.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
  }, [nurseries]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      regional: "bg-purple-500/10 text-purple-600",
      super: "bg-blue-500/10 text-blue-600",
      community: "bg-green-500/10 text-green-600",
    };
    return colors[type] || "bg-pale text-[var(--very-dark-color)]";
  };

  const handleOpenModal = () => {
    setModalMode("create");
    setSelectedNursery(null);
    setFormData(emptyRegionalNurseryForm());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNursery(null);
    setModalMode("create");
  };

  const handleViewNursery = async (nursery: Nursery) => {
    setSelectedNursery(nursery);
    setViewNurseryDetails(nursery);
    setViewNurseryStats(null);
    setViewLoading(true);
    setIsViewModalOpen(true);
    try {
      const [details, stats] = await Promise.all([
        api.getNurseryHierarchy(nursery.id),
        api.getNurseryStats(nursery.id).catch(() => null),
      ]);
      setViewNurseryDetails(details);
      setViewNurseryStats(stats);
    } catch (err) {
      console.error("Failed to load nursery details:", err);
    } finally {
      setViewLoading(false);
    }
  };
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedNursery(null);
    setViewNurseryDetails(null);
    setViewNurseryStats(null);
    setViewLoading(false);
  };


  const handleEditNursery = (nursery: Nursery) => {
    setModalMode("edit");
    setSelectedNursery(nursery);
    setFormData({
      name: nursery.name || "",
      description: nursery.description || "",
      location: nursery.location || "",
      region: nursery.region || "",
      district: nursery.district || "",
      capacity: String(nursery.capacity ?? ""),
      contact_email: nursery.contact_email || "",
      contact_phone: nursery.contact_phone || "",
      latitude: typeof nursery.latitude === "number" ? nursery.latitude.toFixed(2) : "",
      longitude: typeof nursery.longitude === "number" ? nursery.longitude.toFixed(2) : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "edit" && selectedNursery) {
        const request: UpdateNurseryRequest = {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          region: formData.region,
          district: formData.district,
          capacity: parseInt(formData.capacity),
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
        };
        await api.updateNursery(selectedNursery.id, request);
      } else {
        const request: CreateNurseryRequest = {
          name: formData.name,
          type: "regional",
          description: formData.description,
          location: formData.location,
          region: formData.region,
          district: formData.district,
          capacity: parseInt(formData.capacity),
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
        };
        await api.createNursery(request);
      }
      await reloadNurseries();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save nursery:", err);
      setError(modalMode === "edit" ? "Failed to update nursery." : "Failed to create nursery.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Nursery",
      message: "Are you sure you want to delete this nursery? All associated data will be permanently removed.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    // Optimistic UI update - remove from state immediately
    setNurseries(prev => prev.filter(n => n.id !== id));

    try {
      await api.deleteNursery(id);
    } catch (err) {
      console.error("Failed to delete nursery:", err);
      // Revert on error by reloading
      await reloadNurseries();
    }
  };

  const [locationLoading, setLocationLoading] = useState(false);

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(2),
      longitude: lng.toFixed(2),
    }));
    setLocationLoading(true);
    try {
      const location = await reverseGeocode(lat, lng);
      if (location) {
        setFormData(prev => ({
          ...prev,
          region: location.region || prev.region,
          district: location.district || prev.district,
          location: location.village || location.displayName?.split(",")[0] || prev.location,
        }));
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle GPS location
  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocationWithAddress();
      if (location) {
        setFormData(prev => ({
          ...prev,
          latitude: location.latitude.toFixed(2),
          longitude: location.longitude.toFixed(2),
          region: location.region || prev.region,
          district: location.district || prev.district,
          location: location.village || prev.location,
        }));
      }
    } catch (err) {
      console.error("Get location error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle search result selection
  const handleSearchSelect = (result: GeoSearchResult) => {
    setFormData(prev => ({
      ...prev,
      latitude: result.latitude.toFixed(2),
      longitude: result.longitude.toFixed(2),
      region: result.address.region || result.address.state || prev.region,
      district: result.address.district || result.address.county || prev.district,
      location: result.address.village || result.address.town || prev.location,
    }));
  };

  const columns: Column<Nursery>[] = [
    {
      key: "nursery_id",
      header: "ID",
      render: (item) => <span className="font-mono text-primary">{item.nursery_id}</span>,
    },
    {
      key: "name",
      header: "Name",
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (item) => item.region || item.location || "N/A",
    },
    {
      key: "contact",
      header: "Primary contact",
      render: (item) => {
        const op = item.operator;
        if (!op) {
          return (
            <span className="text-caption text-[var(--very-dark-color)]/50">
              {item.contact_email || "—"}
            </span>
          );
        }
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-body-sm font-medium">{op.name}</span>
            <span className="text-caption text-[var(--very-dark-color)]/60">{op.email}</span>
          </div>
        );
      },
    },
    {
      key: "current_stock",
      header: "Stock",
      render: (item) => `${(item.current_stock / 1000).toFixed(2)}k`,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (item) => {
        const percent = item.capacity > 0 ? (item.current_stock / item.capacity) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-pale rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <span className="text-xs">{percent.toFixed(2)}%</span>
          </div>
        );
      },
    },
    {
      key: "is_verified",
      header: "Status",
      render: (item) => (
        <Badge className={item.is_verified ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
          {item.is_verified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
  ];

  const detailNursery = viewNurseryDetails ?? selectedNursery;
  const utilization = detailNursery && detailNursery.capacity > 0
    ? (detailNursery.current_stock / detailNursery.capacity) * 100
    : 0;

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-h4 mb-1">Nursery Network</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Self-service sign-ups create regional nursery records here. Approve pending sites, then manage stock, capacity, and hierarchy across the network.
              </p>
            </div>
            <Button onClick={handleOpenModal} className="self-start sm:self-auto sm:flex-shrink-0">
              <Plus size={16} className="mr-2" />
              Add Nursery
            </Button>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={() => void loadNurseryNetwork()} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Network sites"
              value={stats.total}
              icon={<Building2 size={20} />}
              index={0}
            />
            <SummaryCard
              title="Pending approval"
              value={stats.pendingCount}
              icon={<Clock size={20} />}
              index={1}
            />
            <SummaryCard
              title="Total stock"
              value={`${(stats.totalStock / 1000).toFixed(2)}k`}
              icon={<Sprout size={20} />}
              index={2}
            />
            <SummaryCard
              title="Verified sites"
              value={stats.verifiedCount}
              icon={<CheckCircle size={20} />}
              index={3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Nursery Types"
              description="Distribution by type"
              type="donut"
              data={typeChartData}
            />
            <Card className="border-0 shadow-custom">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-h5">Geo Distribution</h3>
                  <p className="text-caption text-[var(--very-dark-color)]/60">
                    Nursery locations and stock across the network
                  </p>
                </div>
                <NurseryLocationsMap nurseries={nurseries} height="320px" />
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <DataTable
            data={nurseries}
            columns={columns}
            title="Nursery directory"
            description="Regional self-registrations appear as pending until you approve. Admin-added sites are verified immediately. Use Approve to activate the nursery and its operator account."
            searchable
            searchPlaceholder="Search by name, ID, region, or contact…"
            searchKeys={["name", "nursery_id", "region", "contact_email"] as (keyof Nursery)[]}
            actions={(item) => (
              <div className="flex flex-wrap gap-1 justify-end">
                {!item.is_verified ? (
                  <Button
                    size="sm"
                    variant="pale"
                    onClick={() => void handleApproveNursery(item)}
                    disabled={approvingNurseryId === item.id}
                  >
                    <CheckCircle2 size={14} />
                    <span className="text-caption">
                      {approvingNurseryId === item.id ? "Approving…" : "Approve"}
                    </span>
                  </Button>
                ) : null}
                <Button size="sm" variant="pale" title="View" onClick={() => handleViewNursery(item)}>
                  <Eye size={14} />
                </Button>
                <Button size="sm" variant="pale" title="Edit" onClick={() => handleEditNursery(item)}>
                  <Edit size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => handleDelete(item.id)} title="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No nurseries in the network yet."
          />

          {/* Add Nursery Modal - Full Page with 2 Columns */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={modalMode === "edit" ? "Edit nursery" : "Add regional nursery"}
            size="full"
          >
            <form onSubmit={handleSubmit} className="h-full flex flex-col min-h-0">
              <RegionalNurseryFormGrid
                formData={formData}
                setFormData={setFormData}
                locationLoading={locationLoading}
                onSearchSelect={handleSearchSelect}
                onMapClick={handleMapClick}
                onGetLocation={handleGetLocation}
              />

              <div className="flex justify-end gap-4 p-6 border-t border-[var(--border)] bg-paper shrink-0">
                <Button type="button" variant="pale" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {modalMode === "edit" ? "Save Changes" : "Create Nursery"}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isViewModalOpen}
            onClose={handleCloseViewModal}
            title="Nursery details"
            size="full"
          >
            {detailNursery ? (
              <div className="h-full flex flex-col min-h-0">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                  <div className="bg-pale p-6 sm:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto scrollbar-thin">
                    <h3 className="text-h5 mb-6 text-[var(--very-dark-color)]">Site location</h3>
                    <div className="mb-6 space-y-2">
                      <p className="text-label text-[var(--very-dark-color)]">Address / location</p>
                      <p className="text-body-sm">{detailNursery.location || "N/A"}</p>
                      <p className="text-caption text-[var(--very-dark-color)]/70">
                        {detailNursery.region || "N/A"} {detailNursery.district ? `, ${detailNursery.district}` : ""}
                      </p>
                    </div>
                    <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-[var(--border)]">
                      <NurseryLocationsMap nurseries={[detailNursery]} height="100%" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-6">
                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Latitude</p>
                        <div className="text-body-sm text-[var(--very-dark-color)]">
                          {typeof detailNursery.latitude === "number" ? detailNursery.latitude.toFixed(2) : "N/A"}
                        </div>
                      </div>
                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Longitude</p>
                        <div className="text-body-sm text-[var(--very-dark-color)]">
                          {typeof detailNursery.longitude === "number" ? detailNursery.longitude.toFixed(2) : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-paper p-6 sm:p-8 overflow-y-auto scrollbar-thin">
                    <h3 className="text-h5 mb-6 text-[var(--very-dark-color)]">Nursery details</h3>

                    {viewLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {Array.from({ length: 2 }).map((_, idx) => (
                          <SkeletonCard key={idx} />
                        ))}
                      </div>
                    ) : null}

                    <div className="space-y-6">
                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Nursery name</p>
                        <div className="text-body-sm text-[var(--very-dark-color)]">
                          {detailNursery.name || "N/A"}
                        </div>
                      </div>

                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Description</p>
                        <div className="text-body-sm text-[var(--very-dark-color)]">
                          {detailNursery.description || "N/A"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Region</p>
                          <div className="text-body-sm text-[var(--very-dark-color)]">
                            {detailNursery.region || "N/A"}
                          </div>
                        </div>
                        <div>
                          <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">District</p>
                          <div className="text-body-sm text-[var(--very-dark-color)]">
                            {detailNursery.district || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Capacity (seedlings)</p>
                        <div className="text-body-sm text-[var(--very-dark-color)]">
                          {detailNursery.capacity.toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Contact email</p>
                          <div className="text-body-sm text-[var(--very-dark-color)]">
                            {detailNursery.contact_email || detailNursery.operator?.email || "N/A"}
                          </div>
                        </div>
                        <div>
                          <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Contact phone</p>
                          <div className="text-body-sm text-[var(--very-dark-color)]">
                            {detailNursery.contact_phone || detailNursery.operator?.phone || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="block text-label mb-2 text-[var(--very-dark-color)]/40">Operations snapshot</p>
                        <div className="text-body-sm text-[var(--very-dark-color)] space-y-1">
                          <p>Stock: {detailNursery.current_stock.toLocaleString()}</p>
                          <p>Utilization: {utilization.toFixed(2)}%</p>
                          <p>
                            Germination: {(viewNurseryStats?.germination_rate ?? detailNursery.germination_rate ?? 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getTypeColor(detailNursery.type)}>{detailNursery.type}</Badge>
                        <Badge className={detailNursery.is_verified ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                          {detailNursery.is_verified ? "Verified" : "Pending"}
                        </Badge>
                        <Badge className={detailNursery.is_active ? "bg-blue-500/10 text-blue-600" : "bg-gray-500/10 text-gray-600"}>
                          {detailNursery.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className="bg-slate-500/10 text-slate-600">{detailNursery.nursery_id}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 p-6 border-t border-[var(--border)] bg-paper shrink-0">
                  <Button type="button" variant="pale" onClick={handleCloseViewModal}>
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      handleCloseViewModal();
                      handleEditNursery(detailNursery);
                    }}
                  >
                    <Edit size={14} className="mr-2" />
                    Edit nursery
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

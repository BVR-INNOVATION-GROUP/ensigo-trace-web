"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Sprout, MapPin, Package, Plus, CheckCircle, Building2, Edit, Trash2, Eye, Search, Crosshair, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AddressAutocomplete, RegionDistrictSelect, reverseGeocode, getCurrentLocationWithAddress, formatCoordinates, type GeoSearchResult } from "@/components/geo";
import dynamic from "next/dynamic";
import api, { Nursery, CreateNurseryRequest } from "@/src/api/client";

// Dynamic import for map
const LocationMap = dynamic(() => import("@/components/geo/location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-pale flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  ),
});

export default function NurseriesPage() {
  const { confirm } = useConfirm();
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "community",
    description: "",
    location: "",
    region: "",
    district: "",
    capacity: "",
    latitude: "",
    longitude: "",
    contact_email: "",
    contact_phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadNurseries();
  }, []);

  const loadNurseries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllNurseries({ limit: 100 });
      setNurseries(response.data);
    } catch (err) {
      console.error("Failed to load nurseries:", err);
      setError("Failed to load nurseries.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = nurseries.length;
    const totalCapacity = nurseries.reduce((sum, n) => sum + (n.capacity || 0), 0);
    const totalStock = nurseries.reduce((sum, n) => sum + (n.current_stock || 0), 0);
    const verifiedCount = nurseries.filter(n => n.is_verified).length;
    return { total, totalCapacity, totalStock, verifiedCount };
  }, [nurseries]);

  // Chart data
  const typeChartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    nurseries.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
  }, [nurseries]);

  const capacityChartData = useMemo(() => {
    return nurseries
      .slice(0, 6)
      .map(n => ({
        label: n.name.substring(0, 15) + (n.name.length > 15 ? "..." : ""),
        value: Math.round((n.current_stock / Math.max(n.capacity, 1)) * 100),
      }));
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
    setFormData({
      name: "",
      type: "community",
      description: "",
      location: "",
      region: "",
      district: "",
      capacity: "",
      latitude: "",
      longitude: "",
      contact_email: "",
      contact_phone: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const request: CreateNurseryRequest = {
        name: formData.name,
        type: formData.type,
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
      await loadNurseries();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create nursery:", err);
      setError("Failed to create nursery.");
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
      await loadNurseries();
    }
  };

  const [locationLoading, setLocationLoading] = useState(false);

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
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
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6),
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
      latitude: result.latitude.toFixed(6),
      longitude: result.longitude.toFixed(6),
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
      key: "current_stock",
      header: "Stock",
      render: (item) => `${(item.current_stock / 1000).toFixed(1)}k`,
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
            <span className="text-xs">{percent.toFixed(0)}%</span>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h4 mb-1">Nursery Network</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Monitor and manage all nurseries in the network
              </p>
            </div>
            <Button onClick={handleOpenModal}>
              <Plus size={16} className="mr-2" />
              Add Nursery
            </Button>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={loadNurseries} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Nurseries"
              value={stats.total}
              icon={<Building2 size={20} />}
              index={0}
            />
            <SummaryCard
              title="Total Stock"
              value={`${(stats.totalStock / 1000).toFixed(0)}k`}
              icon={<Sprout size={20} />}
              index={1}
            />
            <SummaryCard
              title="Total Capacity"
              value={`${(stats.totalCapacity / 1000).toFixed(0)}k`}
              icon={<Package size={20} />}
              index={2}
            />
            <SummaryCard
              title="Verified"
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
            <ChartCard
              title="Capacity Utilization"
              description="Current stock vs capacity"
              type="progress"
              data={capacityChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={nurseries}
            columns={columns}
            title="All Nurseries"
            description="Complete list of nurseries in the network"
            searchable
            searchPlaceholder="Search nurseries..."
            searchKeys={["name", "nursery_id", "region"] as (keyof Nursery)[]}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="pale" title="View">
                  <Eye size={14} />
                </Button>
                <Button size="sm" variant="pale" title="Edit">
                  <Edit size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => handleDelete(item.id)} title="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No nurseries found"
          />

          {/* Add Nursery Modal - Full Page with 2 Columns */}
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Nursery" size="full">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                {/* Left Column - Map */}
                <div className="bg-pale p-8 flex flex-col border-r border-[var(--very-dark-color)]/10 overflow-y-auto scrollbar-thin">
                  <h3 className="text-h5 mb-6 flex items-center gap-2">
                    {/* <MapPin size={20} /> */}
                    Nursery Location
                  </h3>

                  {/* Search */}
                  <div className="mb-6">
                    <label className="block text-label mb-3">
                      {/* <Search size={14} className="inline mr-1" /> */}
                      Search Location
                    </label>
                    <AddressAutocomplete
                      placeholder="Search for a place in Uganda..."
                      onSelect={handleSearchSelect}
                    />
                  </div>

                  {/* GPS Button */}
                  <div className="mb-6 flex items-center gap-4">
                    <Button
                      type="button"
                      onClick={handleGetLocation}
                      variant="pale"
                      className="bg-[var(--very-dark-color)] rounded-full text-white hover:bg-[var(--very-dark-color)]/90"
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                      ) : (
                        <Crosshair size={16} className="mr-2" />
                      )}
                      Use My Location
                    </Button>
                    {formData.latitude && formData.longitude && (
                      <span className="text-caption opacity-70">
                        {formatCoordinates(parseFloat(formData.latitude), parseFloat(formData.longitude))}
                      </span>
                    )}
                  </div>

                  {/* Map */}
                  <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10">
                    <LocationMap
                      latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                      longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                      onMapClick={handleMapClick}
                    />
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-label mb-3">Latitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 3.0339"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-label mb-3">Longitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 30.9107"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div className="bg-paper p-8 overflow-y-auto scrollbar-thin">
                  <h3 className="text-h5 mb-6">Nursery Details</h3>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-label mb-3">Nursery Name *</label>
                        <Input
                          placeholder="Enter nursery name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-label mb-3">Type *</label>
                        <CustomSelect
                          value={formData.type}
                          onChange={(value) => setFormData({ ...formData, type: value })}
                          options={[
                            { value: "community", label: "Community" },
                            { value: "super", label: "Super" },
                            { value: "regional", label: "Regional" },
                          ]}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-label mb-3">Description</label>
                      <Input
                        placeholder="Enter description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-label mb-3">Administrative Location</label>
                      <RegionDistrictSelect
                        region={formData.region}
                        district={formData.district}
                        onRegionChange={(value) => setFormData({ ...formData, region: value })}
                        onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                        showVillage={false}
                        layout="vertical"
                      />
                    </div>

                    <div>
                      <label className="block text-label mb-3">Capacity *</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max seedlings capacity"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-label mb-3">Contact Email</label>
                        <Input
                          type="email"
                          placeholder="nursery@example.com"
                          value={formData.contact_email}
                          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-label mb-3">Contact Phone</label>
                        <Input
                          placeholder="+256..."
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-4 p-6 border-t border-[var(--very-dark-color)]/10 bg-paper">
                <Button type="button" variant="pale" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create Nursery
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

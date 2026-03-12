"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { Target, Plus, CheckCircle, FolderOpen, TreePine, Edit, Trash2, MapPin, Search, Crosshair, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AddressAutocomplete, RegionDistrictSelect, reverseGeocode, getCurrentLocationWithAddress, formatCoordinates, type GeoSearchResult } from "@/components/geo";
import dynamic from "next/dynamic";

// Dynamic import for map
const LocationMap = dynamic(() => import("@/components/geo/location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-pale flex items-center justify-center">
      <Loader2 className="animate-spin opacity-40" size={32} />
    </div>
  ),
});

interface Project {
  id: string;
  name: string;
  partner: string;
  location: string;
  region: string;
  district: string;
  latitude?: number;
  longitude?: number;
  targetTrees: number;
  plantedTrees: number;
  species: string[];
  startDate: string;
  status: "planning" | "active" | "completed";
}

export default function ProjectsPage() {
  const { confirm } = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    partner: "",
    location: "",
    region: "",
    district: "",
    latitude: "",
    longitude: "",
    targetTrees: "",
    startDate: "",
    species: "",
    status: "planning",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === "active").length;
    const totalTarget = projects.reduce((sum, p) => sum + p.targetTrees, 0);
    const totalPlanted = projects.reduce((sum, p) => sum + p.plantedTrees, 0);
    return { total, active, totalTarget, totalPlanted };
  }, [projects]);

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = { planning: 0, active: 0, completed: 0 };
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [projects]);

  const progressChartData = useMemo(() => {
    return projects.slice(0, 5).map(p => ({
      label: p.name.substring(0, 12) + (p.name.length > 12 ? "..." : ""),
      value: p.targetTrees > 0 ? Math.round((p.plantedTrees / p.targetTrees) * 100) : 0,
    }));
  }, [projects]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      active: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      partner: "",
      location: "",
      region: "",
      district: "",
      latitude: "",
      longitude: "",
      targetTrees: "",
      startDate: "",
      species: "",
      status: "planning"
    });
    setIsModalOpen(true);
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

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProject: Project = {
      id: `RP-${String(projects.length + 1).padStart(3, "0")}`,
      name: formData.name,
      partner: formData.partner,
      location: formData.location,
      region: formData.region,
      district: formData.district,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      targetTrees: parseInt(formData.targetTrees),
      plantedTrees: 0,
      species: formData.species.split(",").map(s => s.trim()).filter(Boolean),
      startDate: formData.startDate,
      status: formData.status as Project["status"],
    };
    setProjects([...projects, newProject]);
    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Project",
      message: "Are you sure you want to delete this restoration project? All progress data will be lost.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const columns: Column<Project>[] = [
    {
      key: "id",
      header: "Project ID",
      render: (item) => <span className="font-mono text-primary">{item.id}</span>,
    },
    { key: "name", header: "Name" },
    { key: "partner", header: "Partner" },
    { key: "location", header: "Location" },
    {
      key: "targetTrees",
      header: "Target",
      render: (item) => item.targetTrees.toLocaleString(),
    },
    {
      key: "plantedTrees",
      header: "Progress",
      render: (item) => {
        const percent = item.targetTrees > 0 ? (item.plantedTrees / item.targetTrees) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-pale rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
            <span className="text-xs">{percent.toFixed(0)}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge>,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6 min-h-[120px] sm:min-h-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-h4 mb-1">Restoration Projects</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Track progress of all active reforestation initiatives
              </p>
            </div>
            <Button onClick={handleOpenModal} className="min-h-[44px] justify-center sm:justify-start sm:flex-shrink-0">
              <Plus size={16} className="mr-2" />
              Add Project
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Projects" value={stats.total} icon={<FolderOpen size={20} />} index={0} />
            <SummaryCard title="Active" value={stats.active} icon={<Target size={20} />} index={1} />
            <SummaryCard title="Target Trees" value={stats.totalTarget.toLocaleString()} icon={<TreePine size={20} />} index={2} />
            <SummaryCard title="Planted" value={stats.totalPlanted.toLocaleString()} icon={<CheckCircle size={20} />} index={3} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Project Status"
              description="Distribution by status"
              type="donut"
              data={statusChartData}
            />
            <ChartCard
              title="Project Progress"
              description="Completion percentage by project"
              type="progress"
              data={progressChartData}
            />
          </div>

          {/* Data Table */}
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-pale flex items-center justify-center mb-4">
                    <FolderOpen size={32} className="text-[var(--very-dark-color)]/30" />
                  </div>
                  <h3 className="text-h5 mb-2">No Projects Yet</h3>
                  <p className="text-caption text-[var(--very-dark-color)]/60 mb-6 max-w-md">
                    Start tracking your reforestation initiatives by creating your first project.
                  </p>
                  <Button onClick={handleOpenModal}>
                    <Plus size={16} className="mr-2" />
                    Create First Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={projects}
              columns={columns}
              title="All Projects"
              description="View and manage restoration projects"
              searchable
              searchPlaceholder="Search projects..."
              searchKeys={["name", "partner", "location"] as (keyof Project)[]}
              actions={(item) => (
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="pale" title="Edit">
                    <Edit size={14} />
                  </Button>
                  <Button size="sm" variant="pale" onClick={() => handleDelete(item.id)} title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
              emptyMessage="No projects found"
            />
          )}

          {/* Add Project Modal - Full Page with 2 Columns */}
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Project" size="full">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                {/* Left Column - Map */}
                <div className="bg-pale p-8 flex flex-col border-r border-[var(--very-dark-color)]/10 overflow-y-auto scrollbar-thin">
                  <h3 className="text-h5 mb-6 flex items-center gap-2">
                    <MapPin size={20} />
                    Project Location
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
                  <h3 className="text-h5 mb-6">Project Details</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-label mb-3">Project Name *</label>
                      <Input
                        placeholder="Enter project name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-label mb-3">Partner Organization *</label>
                      <Input
                        placeholder="Enter partner name"
                        value={formData.partner}
                        onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                        required
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

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-label mb-3">Target Trees *</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter target"
                          value={formData.targetTrees}
                          onChange={(e) => setFormData({ ...formData, targetTrees: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-label mb-3">Start Date *</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-label mb-3">Species (comma-separated) *</label>
                      <Textarea
                        placeholder="e.g., Albizia coriaria, Markhamia lutea"
                        value={formData.species}
                        onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-label mb-3">Status *</label>
                      <CustomSelect
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value })}
                        options={[
                          { value: "planning", label: "Planning" },
                          { value: "active", label: "Active" },
                          { value: "completed", label: "Completed" },
                        ]}
                        required
                      />
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
                  Create Project
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

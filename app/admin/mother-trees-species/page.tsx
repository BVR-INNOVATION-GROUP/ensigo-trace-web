"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SkeletonAdminLayout } from "@/components/ui/skeleton";
import { Plus, Leaf, TreePine, FlaskConical, Eye, Edit, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import api, { Species, CreateSpeciesRequest, UpdateSpeciesRequest } from "@/src/api/client";

interface SpeciesFormState {
  scientific_name: string;
  common_name: string;
  local_name: string;
  family: string;
  ecological_zone: string;
  native_region: string;
  conservation_status: string;
  growth_rate: string;
  max_height: string;
  uses: string;
  description: string;
}

const emptyForm = (): SpeciesFormState => ({
  scientific_name: "",
  common_name: "",
  local_name: "",
  family: "",
  ecological_zone: "",
  native_region: "",
  conservation_status: "",
  growth_rate: "",
  max_height: "",
  uses: "",
  description: "",
});

export default function MotherTreesSpeciesPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SpeciesFormState>(emptyForm());

  const loadSpecies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSpecies({ limit: 500 });
      setSpecies(res.data);
    } catch (err) {
      console.error("Failed to load species:", err);
      setError("Failed to load species.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSpecies();
  }, []);

  const stats = useMemo(() => {
    const total = species.length;
    const withLocalName = species.filter((s) => Boolean(s.local_name)).length;
    const families = new Set(species.map((s) => s.family).filter(Boolean)).size;
    const active = species.filter((s) => s.is_active !== false).length;
    return { total, withLocalName, families, active };
  }, [species]);

  const familyChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    species.forEach((s) => {
      const family = s.family || "Unknown";
      counts[family] = (counts[family] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [species]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    species.forEach((s) => {
      const key = s.conservation_status || "Not specified";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [species]);

  const columns: Column<Species>[] = [
    {
      key: "scientific_name",
      header: "Scientific name",
      render: (item) => <span className="font-medium">{item.scientific_name}</span>,
    },
    {
      key: "common_name",
      header: "Common name",
      render: (item) => item.common_name || "N/A",
    },
    {
      key: "local_name",
      header: "Local name",
      render: (item) => item.local_name || "N/A",
    },
    {
      key: "family",
      header: "Family",
      render: (item) => item.family || "N/A",
    },
    {
      key: "conservation_status",
      header: "Status",
      render: (item) => (
        <Badge className="bg-primary/10 text-primary">
          {item.conservation_status || "Not specified"}
        </Badge>
      ),
    },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateSpeciesRequest | UpdateSpeciesRequest = {
        scientific_name: formData.scientific_name,
        common_name: formData.common_name || undefined,
        local_name: formData.local_name || undefined,
        family: formData.family || undefined,
        ecological_zone: formData.ecological_zone || undefined,
        native_region: formData.native_region || undefined,
        conservation_status: formData.conservation_status || undefined,
        growth_rate: formData.growth_rate || undefined,
        max_height: formData.max_height ? parseInt(formData.max_height, 10) : undefined,
        uses: formData.uses || undefined,
        description: formData.description || undefined,
      };
      if (modalMode === "edit" && selectedSpecies) {
        await api.updateSpecies(selectedSpecies.id, payload as UpdateSpeciesRequest);
      } else {
        await api.createSpecies(payload as CreateSpeciesRequest);
      }
      setIsModalOpen(false);
      setModalMode("create");
      setSelectedSpecies(null);
      setFormData(emptyForm());
      await loadSpecies();
    } catch (err) {
      console.error("Failed to save species:", err);
      setError(modalMode === "edit" ? "Failed to update species." : "Failed to create species.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSpecies = (item: Species) => {
    setModalMode("edit");
    setSelectedSpecies(item);
    setFormData({
      scientific_name: item.scientific_name || "",
      common_name: item.common_name || "",
      local_name: item.local_name || "",
      family: item.family || "",
      ecological_zone: item.ecological_zone || "",
      native_region: item.native_region || "",
      conservation_status: item.conservation_status || "",
      growth_rate: item.growth_rate || "",
      max_height: item.max_height ? String(item.max_height) : "",
      uses: item.uses || "",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteSpecies = async (item: Species) => {
    const ok = await confirm({
      title: "Delete Species",
      message: `Delete ${item.scientific_name}? Linked mother trees may fail constraints depending on backend data rules.`,
      type: "danger",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await api.deleteSpecies(item.id);
      await loadSpecies();
    } catch (err) {
      console.error("Failed to delete species:", err);
      setError("Failed to delete species.");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <SkeletonAdminLayout />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h4 mb-1">Mother Trees & Species</h1>
              <p className="text-caption text-(--very-dark-color)/60">
                Start from species, then manage mother trees per species record.
              </p>
            </div>
            <Button
              onClick={() => {
                setModalMode("create");
                setSelectedSpecies(null);
                setFormData(emptyForm());
                setIsModalOpen(true);
              }}
              className="self-start sm:self-auto"
            >
              <Plus size={16} className="mr-2" />
              Add Species
            </Button>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={() => void loadSpecies()} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total species" value={stats.total} icon={<Leaf size={20} />} index={0} />
            <SummaryCard title="Families" value={stats.families} icon={<TreePine size={20} />} index={1} />
            <SummaryCard title="With local name" value={stats.withLocalName} icon={<FlaskConical size={20} />} index={2} />
            <SummaryCard title="Active" value={stats.active} icon={<Eye size={20} />} index={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Top Families"
              description="Species distribution by family"
              type="donut"
              data={familyChartData}
            />
            <ChartCard
              title="Conservation Status"
              description="Most used conservation classes"
              type="bar"
              data={statusChartData}
            />
          </div>

          <DataTable
            data={species}
            columns={columns}
            title="Species catalogue"
            description="Click View Trees to open mother tree management for a species."
            searchable
            searchPlaceholder="Search species by scientific/common/local name or family…"
            searchKeys={["scientific_name", "common_name", "local_name", "family"] as (keyof Species)[]}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="pale" onClick={() => { setSelectedSpecies(item); setIsViewOpen(true); }} title="View">
                  <Eye size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => handleEditSpecies(item)} title="Edit">
                  <Edit size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="pale"
                  onClick={() => router.push(`/admin/mother-trees-species/${item.id}`)}
                >
                  <TreePine size={14} />
                  <span className="ml-1">View Trees</span>
                </Button>
                <Button size="sm" variant="pale" onClick={() => void handleDeleteSpecies(item)} title="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No species found."
          />

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setModalMode("create");
              setSelectedSpecies(null);
            }}
            title={modalMode === "edit" ? "Edit species" : "Add species"}
            size="lg"
          >
            <form onSubmit={handleSave} className="space-y-5 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label mb-2">Scientific name *</label>
                  <Input
                    required
                    value={formData.scientific_name}
                    onChange={(e) => setFormData((p) => ({ ...p, scientific_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Common name</label>
                  <Input
                    value={formData.common_name}
                    onChange={(e) => setFormData((p) => ({ ...p, common_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Local name</label>
                  <Input
                    value={formData.local_name}
                    onChange={(e) => setFormData((p) => ({ ...p, local_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Family</label>
                  <Input
                    value={formData.family}
                    onChange={(e) => setFormData((p) => ({ ...p, family: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Ecological zone</label>
                  <Input
                    value={formData.ecological_zone}
                    onChange={(e) => setFormData((p) => ({ ...p, ecological_zone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Native region</label>
                  <Input
                    value={formData.native_region}
                    onChange={(e) => setFormData((p) => ({ ...p, native_region: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Growth rate</label>
                  <Input
                    value={formData.growth_rate}
                    onChange={(e) => setFormData((p) => ({ ...p, growth_rate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Max height (m)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_height}
                    onChange={(e) => setFormData((p) => ({ ...p, max_height: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label mb-2">Conservation status</label>
                <Input
                  value={formData.conservation_status}
                  onChange={(e) => setFormData((p) => ({ ...p, conservation_status: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-label mb-2">Uses</label>
                <Input value={formData.uses} onChange={(e) => setFormData((p) => ({ ...p, uses: e.target.value }))} />
              </div>
              <div>
                <label className="block text-label mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="pale" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {modalMode === "edit" ? "Save Changes" : "Create Species"}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Species details" size="md">
            {selectedSpecies ? (
              <div className="p-6 space-y-2 text-body-sm">
                <p><span className="text-(--very-dark-color)/40">Scientific name:</span> {selectedSpecies.scientific_name}</p>
                <p><span className="text-(--very-dark-color)/40">Common name:</span> {selectedSpecies.common_name || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Local name:</span> {selectedSpecies.local_name || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Family:</span> {selectedSpecies.family || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Ecological zone:</span> {selectedSpecies.ecological_zone || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Native region:</span> {selectedSpecies.native_region || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Conservation:</span> {selectedSpecies.conservation_status || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Uses:</span> {selectedSpecies.uses || "N/A"}</p>
                <p><span className="text-(--very-dark-color)/40">Description:</span> {selectedSpecies.description || "N/A"}</p>
              </div>
            ) : null}
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


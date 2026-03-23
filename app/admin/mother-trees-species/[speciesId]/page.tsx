"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, TreePine, MapPin, HeartPulse, Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import api, { MotherTree, Species, CreateMotherTreeRequest, UpdateMotherTreeRequest } from "@/src/api/client";

interface MotherTreeFormState {
  latitude: string;
  longitude: string;
  region: string;
  district: string;
  village: string;
  ecological_zone: string;
  age: string;
  height: string;
  dbh: string;
  crown_diameter: string;
  health_status: string;
  notes: string;
}

const emptyTreeForm = (): MotherTreeFormState => ({
  latitude: "",
  longitude: "",
  region: "",
  district: "",
  village: "",
  ecological_zone: "",
  age: "",
  height: "",
  dbh: "",
  crown_diameter: "",
  health_status: "",
  notes: "",
});

export default function SpeciesTreesPage() {
  const params = useParams<{ speciesId: string }>();
  const speciesId = params.speciesId;
  const { confirm } = useConfirm();

  const [species, setSpecies] = useState<Species | null>(null);
  const [trees, setTrees] = useState<MotherTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTree, setSelectedTree] = useState<MotherTree | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MotherTreeFormState>(emptyTreeForm());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [speciesRes, treesRes] = await Promise.all([
        api.getSpeciesById(speciesId),
        api.getMotherTreesBySpecies(speciesId),
      ]);
      setSpecies(speciesRes);
      setTrees(treesRes);
    } catch (err) {
      console.error("Failed to load species trees:", err);
      setError("Failed to load species and mother trees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!speciesId) return;
    void loadData();
  }, [speciesId]);

  const stats = useMemo(() => {
    const total = trees.length;
    const avgAge = trees.length > 0 ? Math.round(trees.reduce((sum, t) => sum + (t.age || 0), 0) / trees.length) : 0;
    const avgHeight = trees.length > 0 ? (trees.reduce((sum, t) => sum + (t.height || 0), 0) / trees.length).toFixed(2) : "0.00";
    const regions = new Set(trees.map((t) => t.region).filter(Boolean)).size;
    return { total, avgAge, avgHeight, regions };
  }, [trees]);

  const columns: Column<MotherTree>[] = [
    {
      key: "tree_id",
      header: "Tree ID",
      render: (item) => <span className="font-mono text-primary">{item.tree_id || item.id}</span>,
    },
    {
      key: "region",
      header: "Region",
      render: (item) => item.region || "N/A",
    },
    {
      key: "district",
      header: "District",
      render: (item) => item.district || "N/A",
    },
    {
      key: "age",
      header: "Age",
      render: (item) => (item.age ? `${item.age} yrs` : "N/A"),
    },
    {
      key: "height",
      header: "Height",
      render: (item) => (item.height ? `${item.height} m` : "N/A"),
    },
    {
      key: "health_status",
      header: "Health",
      render: (item) => <Badge className="bg-primary/10 text-primary">{item.health_status || "Not set"}</Badge>,
    },
    {
      key: "registered_date",
      header: "Registered",
      render: (item) => (item.registered_date ? new Date(item.registered_date).toLocaleDateString() : "N/A"),
    },
  ];

  const handleSaveTree = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateMotherTreeRequest | UpdateMotherTreeRequest = {
        species_id: speciesId,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        region: formData.region || undefined,
        district: formData.district || undefined,
        village: formData.village || undefined,
        ecological_zone: formData.ecological_zone || undefined,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        dbh: formData.dbh ? parseFloat(formData.dbh) : undefined,
        crown_diameter: formData.crown_diameter ? parseFloat(formData.crown_diameter) : undefined,
        health_status: formData.health_status || undefined,
        notes: formData.notes || undefined,
      };
      if (modalMode === "edit" && selectedTree) {
        await api.updateMotherTree(selectedTree.id, payload as UpdateMotherTreeRequest);
      } else {
        await api.createMotherTree(payload as CreateMotherTreeRequest);
      }
      setIsModalOpen(false);
      setModalMode("create");
      setSelectedTree(null);
      setFormData(emptyTreeForm());
      await loadData();
    } catch (err) {
      console.error("Failed to save mother tree:", err);
      setError(modalMode === "edit" ? "Failed to update mother tree." : "Failed to create mother tree.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTree = (item: MotherTree) => {
    setModalMode("edit");
    setSelectedTree(item);
    setFormData({
      latitude: String(item.latitude ?? ""),
      longitude: String(item.longitude ?? ""),
      region: item.region || "",
      district: item.district || "",
      village: item.village || "",
      ecological_zone: item.ecological_zone || "",
      age: item.age ? String(item.age) : "",
      height: item.height ? String(item.height) : "",
      dbh: item.dbh ? String(item.dbh) : "",
      crown_diameter: item.crown_diameter ? String(item.crown_diameter) : "",
      health_status: item.health_status || "",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteTree = async (item: MotherTree) => {
    const ok = await confirm({
      title: "Delete Mother Tree",
      message: `Delete ${item.tree_id || item.id}?`,
      type: "danger",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      await api.deleteMotherTree(item.id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete mother tree:", err);
      setError("Failed to delete mother tree.");
    }
  };

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
          <div className="flex flex-col gap-3">
            <Link href="/admin/mother-trees-species" className="inline-flex items-center text-primary text-caption">
              <ArrowLeft size={14} className="mr-1" />
              Back to Species
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-h4 mb-1">{species?.scientific_name || "Species"}</h1>
                <p className="text-caption text-[var(--very-dark-color)]/60">
                  Mother trees management for this species.
                </p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
                <Plus size={16} className="mr-2" />
                Add Mother Tree
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={() => void loadData()} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Mother trees" value={stats.total} icon={<TreePine size={20} />} index={0} />
            <SummaryCard title="Avg age" value={`${stats.avgAge} yrs`} icon={<Calendar size={20} />} index={1} />
            <SummaryCard title="Avg height" value={`${stats.avgHeight} m`} icon={<HeartPulse size={20} />} index={2} />
            <SummaryCard title="Regions" value={stats.regions} icon={<MapPin size={20} />} index={3} />
          </div>

          <DataTable
            data={trees}
            columns={columns}
            title="Mother trees"
            description={`All mother trees linked to ${species?.scientific_name || "selected species"}.`}
            searchable
            searchPlaceholder="Search by tree ID, region, district, or health…"
            searchKeys={["tree_id", "region", "district", "health_status"] as (keyof MotherTree)[]}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="pale" onClick={() => { setSelectedTree(item); setIsViewOpen(true); }} title="View">
                  <Eye size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => handleEditTree(item)} title="Edit">
                  <Edit size={14} />
                </Button>
                <Button size="sm" variant="pale" onClick={() => void handleDeleteTree(item)} title="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
            emptyMessage="No mother trees for this species yet."
          />

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setModalMode("create");
              setSelectedTree(null);
            }}
            title={modalMode === "edit" ? "Edit mother tree" : "Add mother tree"}
            size="lg"
          >
            <form onSubmit={handleSaveTree} className="space-y-5 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label mb-2">Latitude *</label>
                  <Input
                    type="number"
                    step="any"
                    required={modalMode === "create"}
                    value={formData.latitude}
                    onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Longitude *</label>
                  <Input
                    type="number"
                    step="any"
                    required={modalMode === "create"}
                    value={formData.longitude}
                    onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Region</label>
                  <Input value={formData.region} onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">District</label>
                  <Input value={formData.district} onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">Village</label>
                  <Input value={formData.village} onChange={(e) => setFormData((p) => ({ ...p, village: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">Ecological zone</label>
                  <Input
                    value={formData.ecological_zone}
                    onChange={(e) => setFormData((p) => ({ ...p, ecological_zone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">Age (years)</label>
                  <Input type="number" min="0" value={formData.age} onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">Height (m)</label>
                  <Input type="number" step="any" min="0" value={formData.height} onChange={(e) => setFormData((p) => ({ ...p, height: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">DBH</label>
                  <Input type="number" step="any" min="0" value={formData.dbh} onChange={(e) => setFormData((p) => ({ ...p, dbh: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-label mb-2">Crown diameter</label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.crown_diameter}
                    onChange={(e) => setFormData((p) => ({ ...p, crown_diameter: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label mb-2">Health status</label>
                <Input
                  placeholder="excellent / good / fair / poor"
                  value={formData.health_status}
                  onChange={(e) => setFormData((p) => ({ ...p, health_status: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-label mb-2">Notes</label>
                <Input value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="pale" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {modalMode === "edit" ? "Save Changes" : "Create Mother Tree"}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Mother tree details" size="md">
            {selectedTree ? (
              <div className="p-6 space-y-2 text-body-sm">
                <p><span className="text-[var(--very-dark-color)]/40">Tree ID:</span> {selectedTree.tree_id || selectedTree.id}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Species:</span> {selectedTree.species?.scientific_name || species?.scientific_name || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Region:</span> {selectedTree.region || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">District:</span> {selectedTree.district || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Village:</span> {selectedTree.village || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Coordinates:</span> {selectedTree.latitude}, {selectedTree.longitude}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Age:</span> {selectedTree.age || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Height:</span> {selectedTree.height || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Health:</span> {selectedTree.health_status || "N/A"}</p>
                <p><span className="text-[var(--very-dark-color)]/40">Notes:</span> {selectedTree.notes || "N/A"}</p>
              </div>
            ) : null}
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


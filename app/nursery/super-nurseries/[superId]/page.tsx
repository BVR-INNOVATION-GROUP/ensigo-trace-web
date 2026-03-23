"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Building2, Package, Store, Warehouse } from "lucide-react";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { CreateNurseryRequest, Nursery } from "@/src/api/client";

export default function SuperNurseryCommunityPage() {
  const params = useParams<{ superId: string }>();
  const superId = params.superId;

  const [superNursery, setSuperNursery] = useState<Nursery | null>(null);
  const [communities, setCommunities] = useState<Nursery[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formRegion, setFormRegion] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formLocation, setFormLocation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [superData, allCommunities] = await Promise.all([
        api.getNursery(superId),
        api.getNurseries({ type: "community", limit: 1000, offset: 0 }),
      ]);
      setSuperNursery(superData);
      setFormRegion(superData.region || "");
      setFormDistrict(superData.district || "");
      setFormLocation(superData.location || "");
      setCommunities(allCommunities.data.filter((n) => n.parent_nursery_id === superId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading community nurseries");
    } finally {
      setLoading(false);
    }
  }, [superId]);

  useEffect(() => {
    if (superId) load();
  }, [superId, load]);

  const createCommunity = useCallback(async () => {
    if (!superNursery || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CreateNurseryRequest = {
        name: name.trim(),
        type: "community",
        region: formRegion || superNursery.region,
        district: formDistrict || superNursery.district,
        location: formLocation || superNursery.location,
        capacity: Number(capacity) || 1000,
        parent_nursery_id: superNursery.id,
      };
      await api.createNursery(payload);
      setName("");
      setIsCreateModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed creating community nursery");
    } finally {
      setSaving(false);
    }
  }, [superNursery, name, capacity, load]);

  const columns = useMemo<Column<Nursery>[]>(
    () => [
      { key: "nursery_id", header: "Code" },
      { key: "name", header: "Community Nursery" },
      { key: "district", header: "District" },
      { key: "capacity", header: "Capacity", render: (row) => row.capacity?.toLocaleString() || "0" },
      { key: "current_stock", header: "Stock", render: (row) => row.current_stock?.toLocaleString() || "0" },
    ],
    []
  );

  const totalCapacity = useMemo(
    () => communities.reduce((sum, n) => sum + (n.capacity || 0), 0),
    [communities]
  );
  const totalStock = useMemo(
    () => communities.reduce((sum, n) => sum + (n.current_stock || 0), 0),
    [communities]
  );
  const stockByCommunityData = useMemo(
    () =>
      communities
        .slice()
        .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
        .slice(0, 8)
        .map((n) => ({ label: n.name, value: n.current_stock || 0 })),
    [communities]
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Community Nurseries</h1>
              <p className="text-caption opacity-70">
                {superNursery ? `Managing communities under ${superNursery.name}` : "Manage community nursery network"}
              </p>
            </div>
            <Button variant="default" disabled={!superNursery} onClick={() => setIsCreateModalOpen(true)}>
              Add Community Nursery
            </Button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Community Nurseries" value={communities.length} icon={<Store size={20} />} />
            <SummaryCard title="Total Capacity" value={totalCapacity} icon={<Warehouse size={20} />} />
            <SummaryCard title="Current Stock" value={totalStock} icon={<Package size={20} />} />
            <SummaryCard title="Parent Super Nursery" value={superNursery?.name || "-"} icon={<Building2 size={20} />} />
          </div>

          <ChartCard
            title="Stock by Community Nursery"
            description="Community nurseries ranked by available stock."
            type="bar"
            data={stockByCommunityData.length > 0 ? stockByCommunityData : [{ label: "No data", value: 0 }]}
            height={300}
          />

          <DataTable
            data={communities}
            columns={columns}
            title="Community Nurseries"
            description={loading ? "Loading..." : "Roadside/community seedling outlets linked to this super nursery"}
            searchable
            searchPlaceholder="Search communities..."
            searchKeys={["name", "nursery_id"]}
            emptyMessage={loading ? "Loading community nurseries..." : "No community nurseries yet"}
          />

          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Community Nursery" size="lg">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="Community nursery name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input type="number" min={1} placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Input placeholder="Region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">District</label>
                  <Input placeholder="District" value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="Location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="pale" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button onClick={createCommunity} disabled={!superNursery || !name.trim()} loading={saving}>
                  Add Community Nursery
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

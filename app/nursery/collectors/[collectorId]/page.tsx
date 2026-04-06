"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { UnitCostModal } from "@/components/ui/unit-cost-modal";
import { CheckCircle2, Clock3, Package, Trees } from "lucide-react";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { Nursery, SeedBatch, SeedCollection, User } from "@/src/api/client";

type CollectionRow = SeedCollection & {
  species_label: string;
  qty_label: string;
  date_label: string;
};

export default function CollectorCollectionsPage() {
  const params = useParams<{ collectorId: string }>();
  const collectorId = params.collectorId;

  const [regionalNursery, setRegionalNursery] = useState<Nursery | null>(null);
  const [collector, setCollector] = useState<User | null>(null);
  const [collections, setCollections] = useState<SeedCollection[]>([]);
  const [inventory, setInventory] = useState<SeedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUnitCostModalOpen, setIsUnitCostModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<SeedCollection | null>(null);

  const resolveRegionalNursery = useCallback(async (): Promise<Nursery | null> => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    const user = JSON.parse(rawUser) as User & { nursery_id?: string; business_name?: string };
    const response = await api.getNurseries({ type: "regional", limit: 200, offset: 0 });
    const regionalNurseries = response.data || [];
    return (
      regionalNurseries.find((n) => n.operator_id === user.id) ||
      regionalNurseries.find((n) => n.id === user.nursery_id || n.nursery_id === user.nursery_id) ||
      regionalNurseries.find(
        (n) =>
          (n.contact_email && user.email && n.contact_email.toLowerCase() === user.email.toLowerCase()) ||
          (n.name && user.business_name && n.name.toLowerCase() === user.business_name.toLowerCase())
      ) ||
      regionalNurseries.find((n) => n.region && user.region && n.region.toLowerCase() === user.region.toLowerCase()) ||
      (regionalNurseries.length === 1 ? regionalNurseries[0] : null)
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const regional = await resolveRegionalNursery();
      setRegionalNursery(regional);
      if (!regional) {
        setCollections([]);
        setInventory([]);
        setError("No regional nursery context found for your account.");
        return;
      }

      const [collectorData, collectorCollections, nurseryInventory] = await Promise.all([
        api.getUser(collectorId),
        api.getCollectorCollections(collectorId, { limit: 500, offset: 0 }),
        api.getNurseryBatches(regional.id, { limit: 500, offset: 0 }),
      ]);

      setCollector(collectorData);
      setCollections(collectorCollections.data || []);
      setInventory(nurseryInventory.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading collector collections");
    } finally {
      setLoading(false);
    }
  }, [collectorId, resolveRegionalNursery]);

  useEffect(() => {
    if (collectorId) {
      void load();
    }
  }, [collectorId, load]);

  const approveToInventory = useCallback(
    async (item: SeedCollection) => {
      setSelectedCollection(item);
      setIsUnitCostModalOpen(true);
    },
    []
  );

  const confirmApproval = useCallback(
    async (unitCost: number, currency: string) => {
      if (!regionalNursery || !selectedCollection?.id) return;
      setActingId(selectedCollection.id);
      setError(null);
      try {
        await api.acceptCollection(selectedCollection.id, regionalNursery.id, unitCost, currency);
        setIsUnitCostModalOpen(false);
        setSelectedCollection(null);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed approving collection");
      } finally {
        setActingId(null);
      }
    },
    [regionalNursery, selectedCollection, load]
  );

  const handleModalClose = useCallback(() => {
    if (!actingId) {
      setIsUnitCostModalOpen(false);
      setSelectedCollection(null);
    }
  }, [actingId]);

  const rows = useMemo<CollectionRow[]>(
    () =>
      collections.map((c) => ({
        ...c,
        species_label: c.species?.scientific_name || c.species_name || "-",
        qty_label: `${c.quantity} ${c.unit}`,
        date_label: c.collection_date ? new Date(c.collection_date).toLocaleDateString() : "-",
      })),
    [collections]
  );

  const columns = useMemo<Column<CollectionRow>[]>(
    () => [
      { key: "collection_number", header: "Collection #" },
      { key: "species_label", header: "Species" },
      { key: "qty_label", header: "Quantity" },
      { key: "date_label", header: "Date" },
      { key: "status", header: "Status" },
    ],
    []
  );

  const pendingCount = useMemo(() => collections.filter((c) => c.status === "pending").length, [collections]);
  const approvedCount = useMemo(() => collections.filter((c) => c.status === "approved").length, [collections]);
  const inventoryTotal = useMemo(() => inventory.reduce((sum, b) => sum + (b.current_quantity || 0), 0), [inventory]);

  const statusChart = useMemo(
    () => [
      { label: "Pending", value: pendingCount },
      { label: "Approved", value: approvedCount },
      { label: "Other", value: Math.max(0, collections.length - pendingCount - approvedCount) },
    ],
    [approvedCount, collections.length, pendingCount]
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-h4">Collector Collections</h1>
            <p className="text-caption opacity-70">
              {collector ? collector.name : "Review collector submissions and approve to inventory."}
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Total Collections" value={collections.length} icon={<Trees size={20} />} />
            <SummaryCard title="Pending Approval" value={pendingCount} icon={<Clock3 size={20} />} />
            <SummaryCard title="Approved" value={approvedCount} icon={<CheckCircle2 size={20} />} />
            <SummaryCard title="Regional Inventory" value={inventoryTotal} icon={<Package size={20} />} />
          </div>

          <ChartCard
            title="Collection Status"
            description="Approval pipeline for this collector's submissions."
            type="donut"
            data={statusChart}
            height={260}
          />

          <DataTable
            data={rows}
            columns={columns}
            title="Collected Seed Submissions"
            description={loading ? "Loading..." : "Approve pending collections to create inventory batches at the regional nursery."}
            searchable
            searchPlaceholder="Search collections..."
            searchKeys={["collection_number", "species_label", "status"]}
            actions={(row) =>
              row.status === "pending" ? (
                <Button size="sm" variant="pale" loading={actingId === row.id} onClick={() => void approveToInventory(row)}>
                  Approve to Inventory
                </Button>
              ) : null
            }
            emptyMessage={loading ? "Loading collections..." : "No collections submitted by this collector yet"}
          />

          <UnitCostModal
            isOpen={isUnitCostModalOpen}
            onClose={handleModalClose}
            onConfirm={confirmApproval}
            loading={!!actingId}
            collectionNumber={selectedCollection?.collection_number}
            speciesName={selectedCollection?.species?.scientific_name || selectedCollection?.species_name}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


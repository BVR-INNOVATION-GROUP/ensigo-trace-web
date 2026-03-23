"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES, type UserRole } from "@/src/models/User";
import api, { Nursery, SeedBatch, User } from "@/src/api/client";

type InventoryRow = SeedBatch & {
  species_label: string;
  quantity_label: string;
  received_label: string;
};

export default function InventoryPage() {
  const router = useRouter();
  const [myNursery, setMyNursery] = useState<Nursery | null>(null);
  const [batches, setBatches] = useState<SeedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<NURSERY_ROLES[number] | null>(null);

  const resolveMyNursery = useCallback(async (currentUser: User & { nursery_id?: string; business_name?: string }) => {
    const typeMap: Record<UserRole, "regional" | "super" | "community"> = {
      regional_nursery: "regional",
      super_nursery: "super",
      community_nursery: "community",
      collector: "community",
      partner: "community",
      admin: "regional",
    };
    const type = typeMap[currentUser.role];
    const result = await api.getNurseries({ type, limit: 500, offset: 0 });
    const rows = result.data || [];
    return (
      rows.find((n) => n.operator_id === currentUser.id) ||
      rows.find((n) => n.id === currentUser.nursery_id || n.nursery_id === currentUser.nursery_id) ||
      rows.find(
        (n) =>
          (n.contact_email && currentUser.email && n.contact_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (n.name && currentUser.business_name && n.name.toLowerCase() === currentUser.business_name.toLowerCase())
      ) ||
      rows.find((n) => n.region && currentUser.region && n.region.toLowerCase() === currentUser.region.toLowerCase()) ||
      (rows.length === 1 ? rows[0] : null)
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const current = JSON.parse(raw) as User & { nursery_id?: string; business_name?: string };
      setCurrentRole(current.role ?? null);
      if (current.role === "regional_nursery") {
        router.replace("/nursery/collectors");
        return;
      }

      const nursery = await resolveMyNursery(current);
      setMyNursery(nursery);
      if (!nursery) {
        setBatches([]);
        setError("No nursery context found for your account.");
        return;
      }

      const response = await api.getNurseryBatches(nursery.id, { limit: 500, offset: 0 });
      setBatches(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading inventory");
    } finally {
      setLoading(false);
    }
  }, [resolveMyNursery, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<InventoryRow[]>(
    () =>
      batches.map((b) => ({
        ...b,
        species_label: b.species?.scientific_name || b.species_name || "-",
        quantity_label: `${b.current_quantity} ${b.unit}`,
        received_label: b.received_date ? new Date(b.received_date).toLocaleDateString() : "-",
      })),
    [batches]
  );

  const lowStockCount = useMemo(() => batches.filter((b) => (b.current_quantity || 0) < 500).length, [batches]);
  const speciesCount = useMemo(() => new Set(rows.map((b) => b.species_label)).size, [rows]);
  const totalInventory = useMemo(() => batches.reduce((sum, b) => sum + (b.current_quantity || 0), 0), [batches]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    batches.forEach((b) => {
      const key = b.status || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [batches]);

  const speciesChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((b) => {
      counts[b.species_label] = (counts[b.species_label] || 0) + (b.current_quantity || 0);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [rows]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      approved: "bg-primary/10 text-primary",
      in_nursery: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      "in-nursery": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      distributed: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      planted: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const columns = useMemo<Column<InventoryRow>[]>(
    () => [
      { key: "batch_number", header: "Batch #" },
      { key: "species_label", header: "Species" },
      { key: "quantity_label", header: "Quantity" },
      {
        key: "status",
        header: "Status",
        render: (item) => <Badge className={getStatusColor(item.status)}>{(item.status || "-").replace("_", " ")}</Badge>,
      },
      { key: "received_label", header: "Received" },
    ],
    []
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Inventory Management</h1>
              <p className="text-caption opacity-70">
                {myNursery ? `Live inventory for ${myNursery.name}` : "Track and monitor nursery stock from approved collections and transfers."}
              </p>
            </div>
            {currentRole === "super_nursery" && myNursery?.id && (
              <div className="pt-1">
                <Button variant="default" onClick={() => router.push(`/nursery/super-nurseries/${myNursery.id}`)}>
                  Manage Communities
                </Button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Batches" value={batches.length} icon={<Package size={20} />} />
            <SummaryCard title="Total Inventory" value={totalInventory} icon={<TrendingUp size={20} />} />
            <SummaryCard title="Species Diversity" value={speciesCount} icon={<TrendingUp size={20} />} />
            <SummaryCard title="Low Stock Alert" value={lowStockCount} icon={<AlertCircle size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Batch Status Distribution" description="Real inventory statuses by batch count." type="donut" data={statusChartData} />
            <ChartCard title="Quantity by Species" description="Current stock quantities per species." type="bar" data={speciesChartData} />
          </div>

          <DataTable
            data={rows}
            columns={columns}
            title="Inventory Batches"
            description={loading ? "Loading..." : "Approved collections and fulfilled transfers reflected as nursery inventory batches."}
            searchable
            searchPlaceholder="Search inventory..."
            searchKeys={["batch_number", "species_label", "status"]}
            emptyMessage={loading ? "Loading inventory..." : "No inventory batches found"}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


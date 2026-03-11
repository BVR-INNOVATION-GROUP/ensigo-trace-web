"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Building2,
  Leaf,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api, { Nursery, NurseryStats, SeedCollection } from "@/src/api/client";

export default function NurseryDashboardPage() {
  const { confirm } = useConfirm();
  const [nursery, setNursery] = useState<Nursery | null>(null);
  const [stats, setStats] = useState<NurseryStats | null>(null);
  const [pendingCollections, setPendingCollections] = useState<SeedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const nurseriesResponse = await api.getNurseries({ limit: 1 });
      if (nurseriesResponse.data.length > 0) {
        const nurseryData = nurseriesResponse.data[0];
        setNursery(nurseryData);

        const [statsData, collectionsData] = await Promise.all([
          api.getNurseryStats(nurseryData.id),
          api.getCollections({ status: "pending", limit: 50 }),
        ]);
        setStats(statsData);
        setPendingCollections(collectionsData.data);
      }
    } catch (err) {
      console.error("Error fetching nursery data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data
  const capacityChartData = useMemo(() => {
    if (!nursery || !stats) return [];
    const used = stats.current_stock || 0;
    const available = Math.max(0, (nursery.capacity || 0) - used);
    return [
      { label: "Current Stock", value: used },
      { label: "Available", value: available },
    ];
  }, [nursery, stats]);

  const performanceChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Germination Rate", value: Math.round(stats.germination_rate || 0) },
      { label: "Distributed", value: Math.round(((stats.distributed_count || 0) / Math.max(stats.total_seedlings || 1, 1)) * 100) },
    ];
  }, [stats]);

  const handleAccept = async (id: string) => {
    const confirmed = await confirm({
      title: "Accept Collection",
      message: "Are you sure you want to accept this seed collection into your nursery?",
      type: "success",
      confirmText: "Accept",
    });
    if (!confirmed) return;

    try {
      setProcessingId(id);
      await api.updateCollection(id, { status: "in_nursery" });
      await fetchData();
    } catch (err) {
      console.error("Failed to accept collection:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const confirmed = await confirm({
      title: "Reject Collection",
      message: "Are you sure you want to reject this seed collection?",
      type: "warning",
      confirmText: "Reject",
    });
    if (!confirmed) return;

    try {
      setProcessingId(id);
      await api.updateCollection(id, { status: "rejected" });
      await fetchData();
    } catch (err) {
      console.error("Failed to reject collection:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const getNurseryTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      regional: "Regional Nursery",
      super: "Super Nursery",
      community: "Community Nursery",
    };
    return labels[type || ""] || "Nursery";
  };

  const columns: Column<SeedCollection>[] = [
    {
      key: "collection_number",
      header: "Collection #",
      render: (item) => <span className="font-mono text-primary">{item.collection_number}</span>,
    },
    {
      key: "species_name",
      header: "Species",
      render: (item) => item.species?.scientific_name || item.species_name || "Unknown",
    },
    {
      key: "collector",
      header: "Collector",
      render: (item) => item.collector?.name || "Unknown",
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "submitted_at",
      header: "Submitted",
      render: (item) => new Date(item.submitted_at).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 size={24} className="text-primary" />
              <h1 className="text-h4">{nursery?.name || "Nursery Dashboard"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary">
                {getNurseryTypeLabel(nursery?.type)}
              </Badge>
              {nursery?.nursery_id && (
                <span className="text-caption font-mono text-[var(--very-dark-color)]/50">
                  {nursery.nursery_id}
                </span>
              )}
            </div>
          </div>
          <Button variant="pale" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Seedlings"
            value={stats?.total_seedlings?.toLocaleString() || 0}
            icon={<Leaf size={20} />}
            index={0}
          />
          <SummaryCard
            title="Active Batches"
            value={stats?.active_batches || 0}
            icon={<TrendingUp size={20} />}
            index={1}
          />
          <SummaryCard
            title="Current Stock"
            value={stats?.current_stock?.toLocaleString() || 0}
            icon={<Building2 size={20} />}
            index={2}
          />
          <SummaryCard
            title="Germination Rate"
            value={`${(stats?.germination_rate || 0).toFixed(1)}%`}
            icon={<TrendingUp size={20} />}
            index={3}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Capacity Utilization"
            description="Current stock vs available capacity"
            type="donut"
            data={capacityChartData}
          />
          <ChartCard
            title="Performance Metrics"
            description="Key nursery performance indicators"
            type="horizontal-bar"
            data={performanceChartData}
          />
        </div>

        {/* Pending Collections Table */}
        <DataTable
          data={pendingCollections}
          columns={columns}
          title="Pending Collections"
          description="Seed collections awaiting your review"
          searchable
          searchPlaceholder="Search collections..."
          searchKeys={["collection_number", "species_name"] as (keyof SeedCollection)[]}
          actions={(item) => (
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant="pale"
                onClick={() => handleAccept(item.id)}
                loading={processingId === item.id}
                disabled={processingId === item.id}
                title="Accept"
              >
                <CheckCircle size={14} />
              </Button>
              <Button
                size="sm"
                variant="pale"
                onClick={() => handleReject(item.id)}
                loading={processingId === item.id}
                disabled={processingId === item.id}
                title="Reject"
              >
                <XCircle size={14} />
              </Button>
            </div>
          )}
          emptyMessage="No pending collections"
        />
      </div>
    </DashboardLayout>
  );
}

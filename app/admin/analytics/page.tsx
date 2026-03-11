"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonSummaryCard } from "@/components/ui/skeleton";
import { Activity, Database, Sprout, Leaf, TrendingUp, Building2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import api, { SeedCollection } from "@/src/api/client";

interface AdminStats {
  totalSeeds: number;
  germinationRate: number;
  survivalRate: number;
  totalPlanted: number;
  activeNurseries: number;
  speciesDiversity: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [collections, setCollections] = useState<SeedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminStats, collectionsResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAllCollections({ limit: 1000 }),
      ]);

      setStats(adminStats);
      setCollections(collectionsResponse.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  // Monthly trends
  const monthlyTrendsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthCounts: Record<string, number> = {};
    
    collections.forEach(c => {
      const date = new Date(c.collection_date);
      const key = monthNames[date.getMonth()];
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .slice(-6)
      .map(([label, value]) => ({ label, value }));
  }, [collections]);

  // Species distribution
  const speciesChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    collections.forEach(c => {
      const species = c.species?.common_name || c.species?.scientific_name || c.species_name || "Unknown";
      counts[species] = (counts[species] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [collections]);

  // Status distribution
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    collections.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ 
      label: label.replace("_", " "), 
      value 
    }));
  }, [collections]);

  // Region distribution
  const regionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    collections.forEach(c => {
      const region = c.region || "Unknown";
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [collections]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-primary/10 text-primary",
      in_nursery: "bg-blue-500/10 text-blue-600",
      distributed: "bg-purple-500/10 text-purple-600",
      planted: "bg-green-500/10 text-green-600",
      rejected: "bg-red-500/10 text-red-600",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const columns: Column<SeedCollection>[] = [
    {
      key: "collection_number",
      header: "Batch #",
      sortable: true,
      render: (item) => <span className="font-mono text-primary">{item.collection_number || item.batch_number}</span>,
    },
    {
      key: "species_name",
      header: "Species",
      sortable: true,
      render: (item) => item.species?.scientific_name || item.species_name || "Unknown",
    },
    {
      key: "quantity",
      header: "Quantity",
      sortable: true,
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "region",
      header: "Region",
      sortable: true,
    },
    {
      key: "collection_date",
      header: "Date",
      sortable: true,
      render: (item) => new Date(item.collection_date).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonSummaryCard key={i} />
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
          <div>
            <h1 className="text-h4 mb-1">Analytics Dashboard</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              Performance metrics and insights for West Nile pilot region
            </p>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={loadData} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <SummaryCard title="Total Seeds" value={stats?.totalSeeds.toLocaleString() || "0"} icon={<Database size={20} />} index={0} />
            <SummaryCard title="Germination" value={`${stats?.germinationRate.toFixed(1) || 0}%`} icon={<Sprout size={20} />} index={1} />
            <SummaryCard title="Survival" value={`${stats?.survivalRate.toFixed(1) || 0}%`} icon={<Leaf size={20} />} index={2} />
            <SummaryCard title="Planted" value={stats?.totalPlanted.toLocaleString() || "0"} icon={<Activity size={20} />} index={3} />
            <SummaryCard title="Nurseries" value={stats?.activeNurseries || 0} icon={<Building2 size={20} />} index={4} />
            <SummaryCard title="Species" value={stats?.speciesDiversity || 0} icon={<TrendingUp size={20} />} index={5} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Monthly Collection Trends"
              description="Seed batch collections over time"
              type="area"
              data={monthlyTrendsData}
            />
            <ChartCard
              title="Status Distribution"
              description="Current status of all batches"
              type="donut"
              data={statusChartData}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Species Distribution"
              description="Diversity of collected native species"
              type="bar"
              data={speciesChartData}
            />
            <ChartCard
              title="Collections by Region"
              description="Geographic distribution"
              type="horizontal-bar"
              data={regionChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={collections}
            columns={columns}
            title="All Collections"
            description={`${collections.length} total collections`}
            searchable
            searchPlaceholder="Search collections..."
            searchKeys={["collection_number", "species_name", "region"] as (keyof SeedCollection)[]}
            emptyMessage="No collections found"
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

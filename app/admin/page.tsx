"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonSummaryCard, SkeletonCard } from "@/components/ui/skeleton";
import { Database, Sprout, TrendingUp, MapPin, Leaf, Activity, Eye } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import api, { SeedCollection } from "@/src/api/client";

interface AdminStats {
  totalSeeds: number;
  verifiedMotherTrees: number;
  germinationRate: number;
  activeRegions: number;
  totalPlanted: number;
  carbonSequestered: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBatches, setRecentBatches] = useState<SeedCollection[]>([]);
  const [allCollections, setAllCollections] = useState<SeedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminStats, recentResponse, allResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAllCollections({ limit: 5 }),
        api.getAllCollections({ limit: 100 }),
      ]);

      setStats(adminStats);
      setRecentBatches(recentResponse.data);
      setAllCollections(allResponse.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allCollections.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ 
      label: label.replace("_", " "), 
      value 
    }));
  }, [allCollections]);

  const regionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allCollections.forEach(c => {
      const region = c.region || "Unknown";
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }, [allCollections]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-primary/10 text-primary",
      in_nursery: "bg-blue-500/10 text-blue-600",
      distributed: "bg-purple-500/10 text-purple-600",
      planted: "bg-green-500/10 text-green-600",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const columns: Column<SeedCollection>[] = [
    {
      key: "collection_number",
      header: "Batch #",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-primary">{item.collection_number || item.batch_number}</span>
      ),
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
      header: "Qty",
      sortable: true,
      render: (item) => `${item.quantity} ${item.unit}`,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h1 className="text-h4 mb-1">Admin Dashboard</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              Ensigo HQ - West Nile Pilot Region Overview
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Seeds Tracked"
              value={stats?.totalSeeds.toLocaleString() || "0"}
              icon={<Database size={20} />}
              index={0}
            />
            <SummaryCard
              title="Mother Trees Verified"
              value={stats?.verifiedMotherTrees || 0}
              icon={<Sprout size={20} />}
              index={1}
            />
            <SummaryCard
              title="Germination Rate"
              value={`${stats?.germinationRate.toFixed(1) || 0}%`}
              icon={<TrendingUp size={20} />}
              index={2}
            />
            <SummaryCard
              title="Active Regions"
              value={stats?.activeRegions || 0}
              icon={<MapPin size={20} />}
              index={3}
            />
            <SummaryCard
              title="Trees Planted"
              value={stats?.totalPlanted.toLocaleString() || "0"}
              icon={<Leaf size={20} />}
              index={4}
            />
            <SummaryCard
              title="Carbon Sequestered"
              value={`${stats?.carbonSequestered.toFixed(1) || 0}t`}
              icon={<Activity size={20} />}
              index={5}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Status Distribution"
              description="Batches by current status"
              type="donut"
              data={statusChartData}
            />
            <ChartCard
              title="Collections by Region"
              description="Geographic distribution"
              type="bar"
              data={regionChartData}
            />
          </div>

          {/* Recent Collections Table */}
          <DataTable
            data={recentBatches}
            columns={columns}
            title="Recent Seed Collections"
            description="Latest seed collection activities requiring attention"
            actions={(item) => (
              <Button size="sm" variant="pale">
                <Eye size={14} />
              </Button>
            )}
            emptyMessage="No collections found"
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

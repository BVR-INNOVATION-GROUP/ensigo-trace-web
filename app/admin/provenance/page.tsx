"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import { TreePine, Heart, Eye, Leaf, CheckCircle, Edit, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProvenanceMap } from "@/components/dashboard/provenance-map";
import api, { MotherTree } from "@/src/api/client";

interface MapTree {
  id: string;
  species: string;
  gpsCoordinates: { lat: number; lng: number };
  age: number;
  height: number;
  ecologicalZone: string;
  healthStatus: string;
  registeredDate: string;
}

export default function ProvenancePage() {
  const { confirm } = useConfirm();
  const [motherTrees, setMotherTrees] = useState<MotherTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMotherTrees();
  }, []);

  const loadMotherTrees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllMotherTrees({ limit: 100 });
      setMotherTrees(response.data);
    } catch (err) {
      console.error("Failed to load mother trees:", err);
      setError("Failed to load mother trees.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = motherTrees.length;
    const verified = motherTrees.filter(t => t.is_verified).length;
    const avgAge = motherTrees.length > 0 
      ? Math.round(motherTrees.reduce((sum, t) => sum + (t.age || 0), 0) / motherTrees.length)
      : 0;
    const uniqueSpecies = new Set(motherTrees.map(t => t.species?.scientific_name)).size;
    return { total, verified, avgAge, uniqueSpecies };
  }, [motherTrees]);

  // Chart data
  const healthChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    motherTrees.forEach(t => {
      const status = t.health_status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [motherTrees]);

  const speciesChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    motherTrees.forEach(t => {
      const name = t.species?.common_name || t.species?.scientific_name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [motherTrees]);

  const getHealthColor = (status: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-500/10 text-green-600",
      good: "bg-primary/10 text-primary",
      fair: "bg-yellow-500/10 text-yellow-600",
      poor: "bg-red-500/10 text-red-600",
    };
    return colors[status?.toLowerCase()] || "bg-pale text-[var(--very-dark-color)]";
  };

  const mapTrees: MapTree[] = motherTrees.map((tree) => ({
    id: tree.tree_id || tree.id,
    species: tree.species?.scientific_name || "Unknown",
    gpsCoordinates: { lat: tree.latitude, lng: tree.longitude },
    age: tree.age || 0,
    height: tree.height || 0,
    ecologicalZone: tree.region || "Unknown",
    healthStatus: tree.health_status || "good",
    registeredDate: tree.registered_date,
  }));

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Mother Tree",
      message: "Are you sure you want to delete this mother tree record? This will affect seed provenance tracking.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await api.deleteMotherTree(id);
      await loadMotherTrees();
    } catch (err) {
      console.error("Failed to delete mother tree:", err);
    }
  };

  const columns: Column<MotherTree>[] = [
    {
      key: "tree_id",
      header: "Tree ID",
      render: (item) => <span className="font-mono text-primary">{item.tree_id || item.id}</span>,
    },
    {
      key: "species",
      header: "Species",
      render: (item) => item.species?.scientific_name || "Unknown",
    },
    {
      key: "age",
      header: "Age",
      render: (item) => item.age ? `${item.age} yrs` : "N/A",
    },
    {
      key: "height",
      header: "Height",
      render: (item) => item.height ? `${item.height}m` : "N/A",
    },
    {
      key: "region",
      header: "Region",
      render: (item) => item.region || item.district || "N/A",
    },
    {
      key: "health_status",
      header: "Health",
      render: (item) => (
        <Badge className={getHealthColor(item.health_status || "")}>
          {item.health_status || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "registered_date",
      header: "Registered",
      render: (item) => new Date(item.registered_date).toLocaleDateString(),
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
          <div>
            <h1 className="text-h4 mb-1">Provenance Database</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              Verified mother trees and seed source mapping
            </p>
          </div>

          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
                <button onClick={loadMotherTrees} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Trees" value={stats.total} icon={<TreePine size={20} />} index={0} />
            <SummaryCard title="Verified" value={stats.verified} icon={<CheckCircle size={20} />} index={1} />
            <SummaryCard title="Avg Age" value={`${stats.avgAge} yrs`} icon={<Heart size={20} />} index={2} />
            <SummaryCard title="Species" value={stats.uniqueSpecies} icon={<Leaf size={20} />} index={3} />
          </div>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h5">Interactive Provenance Map</CardTitle>
              <CardDescription>Geographical distribution of certified mother trees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10">
                {mapTrees.length > 0 ? (
                  <ProvenanceMap trees={mapTrees} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-pale">
                    <p className="text-caption text-[var(--very-dark-color)]/60">
                      No mother trees registered yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Health Status"
              description="Distribution by health status"
              type="donut"
              data={healthChartData}
            />
            <ChartCard
              title="Top Species"
              description="Most common mother tree species"
              type="bar"
              data={speciesChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={motherTrees}
            columns={columns}
            title="Mother Tree Registry"
            description={`${motherTrees.length} trees registered`}
            searchable
            searchPlaceholder="Search trees..."
            searchKeys={["tree_id", "region"] as (keyof MotherTree)[]}
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
            emptyMessage="No mother trees registered"
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Leaf, TrendingUp, ShoppingCart, Eye } from "lucide-react";
import { mockRestorationProjects, type RestorationProject } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

export default function PartnerDashboard() {
  const [userName, setUserName] = useState("Partner");
  const myProjects = mockRestorationProjects.filter(
    (p) => p.partner === "Green Earth Initiative"
  );

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || "Partner");
    }
  }, []);

  const totalPlanted = myProjects.reduce((acc, p) => acc + p.plantedTrees, 0);
  const totalTarget = myProjects.reduce((acc, p) => acc + p.targetTrees, 0);
  const speciesCount = new Set(myProjects.flatMap((p) => p.species)).size;
  const co2Impact = (totalPlanted * 0.035 / 1000).toFixed(1);

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    myProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [myProjects]);

  const progressChartData = useMemo(() => {
    return myProjects.slice(0, 5).map(p => ({
      label: p.name.substring(0, 12),
      value: Math.round((p.plantedTrees / p.targetTrees) * 100),
    }));
  }, [myProjects]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      active: "bg-primary/10 text-primary",
      completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const columns: Column<RestorationProject>[] = [
    {
      key: "name",
      header: "Project",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    { key: "location", header: "Location" },
    {
      key: "plantedTrees",
      header: "Progress",
      render: (item) => {
        const progress = Math.round((item.plantedTrees / item.targetTrees) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-pale rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-caption">{progress}%</span>
          </div>
        );
      },
    },
    {
      key: "targetTrees",
      header: "Target",
      render: (item) => item.targetTrees.toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge>,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["partner"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h4 mb-1">Partner Dashboard</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Green Earth Initiative - Restoration Projects
              </p>
            </div>
            <Link href="/partner/browse">
              <Button>
                <ShoppingCart size={16} className="mr-2" />
                Browse Seeds
              </Button>
            </Link>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Active Projects" value={myProjects.filter(p => p.status === "active").length} icon={<Target size={20} />} index={0} />
            <SummaryCard title="Trees Planted" value={totalPlanted.toLocaleString()} icon={<Leaf size={20} />} index={1} />
            <SummaryCard title="Species Diversity" value={speciesCount} icon={<TrendingUp size={20} />} index={2} />
            <SummaryCard title="CO₂ Impact" value={`${co2Impact}t`} icon={<Leaf size={20} />} index={3} />
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
              type="horizontal-bar"
              data={progressChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={myProjects}
            columns={columns}
            title="All Projects"
            description="Your restoration initiatives overview"
            searchable
            searchPlaceholder="Search projects..."
            searchKeys={["name", "location"] as (keyof RestorationProject)[]}
            actions={(item) => (
              <Link href={`/partner/projects/${item.id}`}>
                <Button size="sm" variant="pale" title="View Details">
                  <Eye size={14} />
                </Button>
              </Link>
            )}
            emptyMessage="No projects yet"
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

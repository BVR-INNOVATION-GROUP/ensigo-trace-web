"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Sprout, TrendingUp, MapPin, Leaf, Activity } from "lucide-react";
import { mockAnalytics, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminDashboard() {
  const [userName, setUserName] = useState("Admin");
  const recentBatches = mockSeedBatches.slice(0, 5);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || "Admin");
    }
  }, []);

  const stats = [
    {
      title: "Total Seeds Tracked",
      value: mockAnalytics.totalSeeds.toLocaleString(),
      icon: <Database size={18} />,
    },
    {
      title: "Mother Trees Verified",
      value: mockAnalytics.verifiedMotherTrees,
      icon: <Sprout size={18} />,
    },
    {
      title: "Germination Rate",
      value: `${mockAnalytics.germinationRate}%`,
      icon: <TrendingUp size={18} />,
    },
    {
      title: "Active Regions",
      value: mockAnalytics.activeRegions,
      icon: <MapPin size={18} />,
    },
    {
      title: "Trees Planted",
      value: mockAnalytics.totalPlanted.toLocaleString(),
      icon: <Leaf size={18} />,
    },
    {
      title: "Carbon Sequestered",
      value: `${mockAnalytics.carbonSequestered}t`,
      icon: <Activity size={18} />,
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-accent/10 text-accent",
      approved: "bg-primary/10 text-primary",
      "in-nursery": "bg-chart-4/10 text-chart-4",
      distributed: "bg-chart-3/10 text-chart-3",
      planted: "bg-success/10 text-success",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">Admin Dashboard</h1>
            <p className="text-caption opacity-75">
              Ensigo HQ - West Nile Pilot Region Overview
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <SummaryCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                cardImage={1}
                index={index}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-h5">Recent Seed Batches</CardTitle>
              <CardDescription>
                Latest seed collection activities requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-label font-medium">{batch.batchNumber}</h4>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status}
                        </Badge>
                      </div>
                      <p className="text-body-sm mb-1">{batch.species}</p>
                      <p className="text-caption opacity-75">
                        Collected by {batch.collectorName} • {batch.quantity} {batch.unit} • {batch.region}
                      </p>
                      {batch.germinationRate && (
                        <p className="text-caption text-primary mt-1">
                          Germination: {batch.germinationRate}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-body-sm opacity-75">{batch.collectionDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}








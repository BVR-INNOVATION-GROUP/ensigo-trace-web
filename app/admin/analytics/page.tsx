"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TrendingUp, TrendingDown, Activity, Database, Sprout, Leaf } from "lucide-react";
import { mockAnalytics, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const speciesDistribution = mockSeedBatches.reduce((acc, batch) => {
    acc[batch.species] = (acc[batch.species] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistribution = mockSeedBatches.reduce((acc, batch) => {
    acc[batch.status] = (acc[batch.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = [
    { month: "Oct", collections: 8, germination: 75 },
    { month: "Nov", collections: 12, germination: 78 },
    { month: "Dec", collections: 15, germination: 80 },
    { month: "Jan", collections: 18, germination: 82 },
    { month: "Feb", collections: 22, germination: 78.5 },
  ];

  const stats = [
    {
      title: "Total Seeds",
      value: mockAnalytics.totalSeeds.toLocaleString(),
      icon: <Database size={18} />,
    },
    {
      title: "Germination Rate",
      value: `${mockAnalytics.germinationRate}%`,
      icon: <Sprout size={18} />,
    },
    {
      title: "Survival Rate",
      value: `${mockAnalytics.survivalRate}%`,
      icon: <Leaf size={18} />,
    },
    {
      title: "Trees Planted",
      value: mockAnalytics.totalPlanted.toLocaleString(),
      icon: <Activity size={18} />,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">Analytics Dashboard</h1>
            <p className="text-caption opacity-75">
              Performance metrics and insights for West Nile pilot region
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-h5">Monthly Collection Trends</CardTitle>
                <CardDescription>Seed batch collections over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center gap-4">
                      <div className="w-12 text-body-sm font-medium opacity-75">
                        {data.month}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-body-sm font-medium">
                            {data.collections} batches
                          </div>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.collections / 25) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-primary h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h5">Germination Performance</CardTitle>
                <CardDescription>Monthly germination success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center gap-4">
                      <div className="w-12 text-body-sm font-medium opacity-75">
                        {data.month}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-body-sm font-medium">{data.germination}%</div>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.germination}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-primary h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h5">Species Distribution</CardTitle>
                <CardDescription>Diversity of collected native species</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(speciesDistribution).map(([species, count], i) => {
                    const colors = [
                      "bg-primary",
                      "bg-primary",
                      "bg-primary",
                      "bg-primary",
                      "bg-primary",
                    ];
                    const percentage = (count / mockSeedBatches.length) * 100;
                    return (
                      <div key={species}>
                        <div className="flex justify-between text-body-sm mb-1">
                          <span className="text-label font-medium truncate">{species}</span>
                          <span className="text-caption opacity-75">{count} batches</span>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`${colors[i % colors.length]} h-2 rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h5">Batch Status Overview</CardTitle>
                <CardDescription>Current status of all seed batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statusDistribution).map(([status, count], i) => {
                    const colors = [
                      "bg-accent",
                      "bg-primary",
                      "bg-primary",
                      "bg-primary",
                      "bg-primary",
                    ];
                    const percentage = (count / mockSeedBatches.length) * 100;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-body-sm mb-1">
                          <span className="text-label font-medium capitalize">{status}</span>
                          <span className="text-caption opacity-75">{count} batches</span>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`${colors[i % colors.length]} h-2 rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


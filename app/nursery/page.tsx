"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Package, TrendingUp, Activity, Edit } from "lucide-react";
import { mockNurseries, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

export default function NurseryDashboard() {
  const [userName, setUserName] = useState("Nursery Operator");
  const myNursery = mockNurseries[0];
  const [batches] = useState(mockSeedBatches.filter((b) => b.nurseryId === myNursery.id));
  const myBatches = batches;

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || "Nursery Operator");
    }
  }, []);

  const capacityPercent = (myNursery.currentStock / myNursery.capacity) * 100;
  const avgGermination =
    myBatches
      .filter((b) => b.germinationRate)
      .reduce((acc, b) => acc + (b.germinationRate || 0), 0) /
    myBatches.filter((b) => b.germinationRate).length;

  const stats = [
    {
      title: "Current Stock",
      value: myNursery.currentStock.toLocaleString(),
      icon: <Sprout size={18} />,
    },
    {
      title: "Active Batches",
      value: myNursery.activeBatches,
      icon: <Package size={18} />,
    },
    {
      title: "Avg Germination",
      value: `${avgGermination.toFixed(1)}%`,
      icon: <TrendingUp size={18} />,
    },
    {
      title: "Capacity",
      value: `${capacityPercent.toFixed(0)}%`,
      icon: <Activity size={18} />,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["nursery"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">{myNursery.name}</h1>
            <p className="text-caption opacity-75">
              Nursery operations and inventory management
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-h5">Active Seed Batches</CardTitle>
                  <CardDescription>
                    Currently managed batches in your nursery
                  </CardDescription>
                </div>
                <Link href="/nursery/inventory">
                  <Button size="sm" variant="outline">
                    <Edit size={14} className="mr-2" />
                    Manage Inventory
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-label font-medium">{batch.species}</h4>
                        <p className="text-caption opacity-75">Batch {batch.batchNumber}</p>
                      </div>
                      {batch.germinationRate && (
                        <div className="text-right">
                          <p className="text-h5 text-primary">{batch.germinationRate}%</p>
                          <p className="text-caption opacity-75">germination</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-body-sm">
                      <div>
                        <p className="text-caption opacity-75">Quantity</p>
                        <p className="text-label">
                          {batch.quantity} {batch.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption opacity-75">Status</p>
                        <p className="text-label capitalize">{batch.status}</p>
                      </div>
                      <div>
                        <p className="text-caption opacity-75">Collected</p>
                        <p className="text-label">{batch.collectionDate}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--very-dark-color)]/10 flex gap-2">
                      <Link href="/nursery/germination" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <TrendingUp size={14} className="mr-2" />
                          Record Germination
                        </Button>
                      </Link>
                      <Link href="/nursery/inventory" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit size={14} className="mr-2" />
                          Update Batch
                        </Button>
                      </Link>
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


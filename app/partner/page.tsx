"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Leaf, TrendingUp, ShoppingCart } from "lucide-react";
import { mockRestorationProjects } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

export default function PartnerDashboard() {
  const [userName, setUserName] = useState("Partner");
  const myProjects = mockRestorationProjects.filter(
    (p) => p.partner === "Green Earth Initiative"
  );
  const activeProject = myProjects.find((p) => p.status === "active");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || "Partner");
    }
  }, []);

  const stats = [
    {
      title: "Active Projects",
      value: myProjects.filter((p) => p.status === "active").length,
      icon: <Target size={18} />,
    },
    {
      title: "Trees Planted",
      value: myProjects.reduce((acc, p) => acc + p.plantedTrees, 0).toLocaleString(),
      icon: <Leaf size={18} />,
    },
    {
      title: "Species Diversity",
      value: new Set(myProjects.flatMap((p) => p.species)).size,
      icon: <TrendingUp size={18} />,
    },
    {
      title: "CO₂ Impact",
      value: `${(myProjects.reduce((acc, p) => acc + p.plantedTrees, 0) * 0.035 / 1000).toFixed(1)}t`,
      icon: <Leaf size={18} />,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["partner"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-h4 mb-2">Partner Dashboard</h1>
              <p className="text-caption opacity-75">
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
              <CardTitle className="text-h5">All Projects</CardTitle>
              <CardDescription>Your restoration initiatives overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myProjects.map((project) => {
                  const progress = (project.plantedTrees / project.targetTrees) * 100;
                  return (
                    <div
                      key={project.id}
                      className="p-4 border border-[var(--very-dark-color)]/10 rounded-lg hover:bg-pale/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-label font-medium">{project.name}</h4>
                          <p className="text-caption opacity-75">{project.location}</p>
                        </div>
                        <Badge
                          className={
                            project.status === "active"
                              ? "bg-primary/10 text-primary"
                              : "bg-success/10 text-success"
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-body-sm mb-1">
                          <span className="text-caption opacity-75">Progress</span>
                          <span className="text-label">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-body-sm">
                        <div>
                          <p className="text-caption opacity-75">Planted</p>
                          <p className="text-label">{project.plantedTrees.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-caption opacity-75">Target</p>
                          <p className="text-label">{project.targetTrees.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-caption opacity-75">Started</p>
                          <p className="text-label">{project.startDate}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}








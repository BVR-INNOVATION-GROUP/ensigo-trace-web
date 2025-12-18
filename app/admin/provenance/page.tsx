"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TreePine, Ruler, Heart } from "lucide-react";
import { mockMotherTrees } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProvenanceMap } from "@/components/dashboard/provenance-map";
import { motion } from "framer-motion";

export default function ProvenancePage() {
  const getHealthColor = (status: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-primary/10 text-primary",
      good: "bg-primary/10 text-primary",
      fair: "bg-accent/10 text-accent",
      poor: "bg-red-500/10 text-red-500",
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
            <h1 className="text-h4 mb-2">Provenance Database</h1>
            <p className="text-caption opacity-75">
              Verified mother trees and seed source mapping
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-h5">Interactive Provenance Map</CardTitle>
              <CardDescription>
                Geographical distribution of certified mother trees in West Nile region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10">
                <ProvenanceMap trees={mockMotherTrees} />
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="text-h5 mb-4">Mother Tree Registry</h2>
          </div>

          <div className="grid gap-6">
            {mockMotherTrees.map((tree) => (
              <Card key={tree.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-h6 flex items-center gap-2">
                          <TreePine size={18} className="text-primary" />
                          {tree.id}
                        </CardTitle>
                        <Badge className={getHealthColor(tree.healthStatus)}>
                          {tree.healthStatus}
                        </Badge>
                      </div>
                      <CardDescription className="text-label font-medium">
                        {tree.species}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-caption opacity-75">Registered</p>
                      <p className="text-label font-medium">{tree.registeredDate}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                      <Heart size={18} className="text-primary" />
                      <div>
                        <p className="text-caption opacity-75">Age</p>
                        <p className="text-label font-medium">{tree.age} years</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                      <Ruler size={18} className="text-primary" />
                      <div>
                        <p className="text-caption opacity-75">Height</p>
                        <p className="text-label font-medium">{tree.height}m</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                      <MapPin size={18} className="text-primary" />
                      <div>
                        <p className="text-caption opacity-75">GPS</p>
                        <p className="text-label text-xs">
                          {tree.gpsCoordinates.lat.toFixed(4)}, {tree.gpsCoordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                      <TreePine size={18} className="text-primary" />
                      <div>
                        <p className="text-caption opacity-75">Zone</p>
                        <p className="text-label text-xs">{tree.ecologicalZone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-pale rounded-lg">
                    <p className="text-caption opacity-75 mb-2">Ecological Classification</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 border-primary/20">
                        {tree.ecologicalZone}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20">
                        Native Species
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20">
                        Certified Source
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


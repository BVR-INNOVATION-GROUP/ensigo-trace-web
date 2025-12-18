"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { TrendingUp, Droplets, Thermometer, Sun, Edit, Plus } from "lucide-react";
import { mockNurseries, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { CustomSelect } from "@/components/ui/custom-select";
import type { SeedBatch } from "@/src/data/mockData";

export default function GerminationPage() {
  const myNursery = mockNurseries[0];
  const [batches, setBatches] = useState(
    mockSeedBatches.filter((b) => b.nurseryId === myNursery.id)
  );
  const [selectedBatch, setSelectedBatch] = useState<SeedBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [germinationRate, setGerminationRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myBatches = batches.filter((b) => b.germinationRate);

  const avgGermination =
    myBatches.reduce((acc, b) => acc + (b.germinationRate || 0), 0) / myBatches.length;

  const highPerformers = myBatches.filter((b) => (b.germinationRate || 0) >= 80);
  const lowPerformers = myBatches.filter((b) => (b.germinationRate || 0) < 60);

  const stats = [
    {
      title: "Avg Germination",
      value: `${avgGermination.toFixed(1)}%`,
      icon: <TrendingUp size={18} />,
    },
    {
      title: "High Performers",
      value: highPerformers.length,
      icon: <Sun size={18} />,
    },
    {
      title: "Needs Attention",
      value: lowPerformers.length,
      icon: <Droplets size={18} />,
    },
    {
      title: "Active Batches",
      value: myBatches.length,
      icon: <Thermometer size={18} />,
    },
  ];

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-primary";
    if (rate >= 60) return "text-primary";
    return "text-accent";
  };

  const handleOpenModal = (batch: SeedBatch | null = null) => {
    setSelectedBatch(batch);
    setGerminationRate(batch?.germinationRate?.toString() || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBatch(null);
    setGerminationRate("");
  };

  const handleSubmitGermination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      alert("Please select a batch");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const rate = parseFloat(germinationRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert("Please enter a valid germination rate between 0 and 100");
      setIsSubmitting(false);
      return;
    }

    // Update batch in state
    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id ? { ...b, germinationRate: rate } : b
      )
    );

    setIsSubmitting(false);
    handleCloseModal();
  };

  // Include batches without germination rates for recording
  const allBatches = batches;

  return (
    <ProtectedRoute allowedRoles={["nursery"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">Germination Tracking</h1>
            <p className="text-caption opacity-75">
              Monitor germination rates and seedling health across batches
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

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-h5">Batch Performance</CardTitle>
                  <CardDescription>
                    Germination rates across all active batches
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenModal(null)} size="sm">
                  <Plus size={16} className="mr-2" />
                  Record Germination
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {allBatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-caption opacity-75 mb-4">
                      No batches assigned to your nursery yet
                    </p>
                    <Button onClick={() => handleOpenModal(null)} variant="outline">
                      <Plus size={16} className="mr-2" />
                      Record First Germination
                    </Button>
                  </div>
                ) : (
                  allBatches.map((batch) => {
                    const rate = batch.germinationRate || 0;
                    const hasRate = !!batch.germinationRate;
                    return (
                      <div key={batch.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-label font-medium">{batch.species}</p>
                            <p className="text-caption opacity-75">
                              Batch {batch.batchNumber} • {batch.quantity} {batch.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {hasRate ? (
                              <>
                                <div className="text-right">
                                  <p className={`text-h5 ${getPerformanceColor(rate)}`}>
                                    {rate}%
                                  </p>
                                  <p className="text-caption opacity-75">germination</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenModal(batch)}
                                >
                                  <Edit size={14} className="mr-2" />
                                  Update
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleOpenModal(batch)}
                              >
                                <Plus size={14} className="mr-2" />
                                Record Rate
                              </Button>
                            )}
                          </div>
                        </div>
                        {hasRate && (
                          <div className="w-full bg-pale rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rate}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className={`h-2 rounded-full ${
                                rate >= 80
                                  ? "bg-primary"
                                  : rate >= 60
                                  ? "bg-primary"
                                  : "bg-accent"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h5">Germination Tips</CardTitle>
              <CardDescription>Optimize conditions for better rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-pale rounded-lg">
                  <div className="flex items-start gap-3">
                    <Droplets size={18} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-label font-medium mb-1">Water Management</h4>
                      <p className="text-body-sm opacity-75">
                        Maintain consistent moisture levels. Water daily in morning hours.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-pale rounded-lg">
                  <div className="flex items-start gap-3">
                    <Thermometer size={18} className="text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-label font-medium mb-1">Temperature Control</h4>
                      <p className="text-body-sm opacity-75">
                        Keep nursery between 20-30°C. Use shade nets during peak sun.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-pale rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sun size={18} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-label font-medium mb-1">Light Exposure</h4>
                      <p className="text-body-sm opacity-75">
                        Provide partial shade initially, gradually increase light exposure.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-pale rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp size={18} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-label font-medium mb-1">Regular Monitoring</h4>
                      <p className="text-body-sm opacity-75">
                        Check batches daily. Record germination dates and rates promptly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedBatch ? "Update Germination Rate" : "Record Germination Rate"}
            size="md"
          >
            <div className="p-6">
              <form onSubmit={handleSubmitGermination} className="space-y-6">
              {selectedBatch ? (
                <div className="space-y-2">
                  <p className="text-caption opacity-75">Batch Information</p>
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-label font-medium">{selectedBatch.species}</p>
                    <p className="text-caption opacity-75">
                      Batch {selectedBatch.batchNumber} • {selectedBatch.quantity}{" "}
                      {selectedBatch.unit}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Select Batch <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={selectedBatch?.id || ""}
                    onChange={(value) => {
                      const batch = batches.find((b) => b.id === value);
                      setSelectedBatch(batch || null);
                    }}
                    options={batches.map((b) => ({
                      value: b.id,
                      label: `${b.species} - Batch ${b.batchNumber}`,
                    }))}
                    placeholder="Select a batch"
                  />
                  <p className="text-caption opacity-75">
                    Choose the batch to record germination rate for
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-label mb-2">
                  Germination Rate (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter germination rate (0-100)"
                  value={germinationRate}
                  onChange={(e) => setGerminationRate(e.target.value)}
                  required
                />
                <p className="text-caption opacity-75">
                  Enter the percentage of seeds that have successfully germinated
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : selectedBatch ? "Update Rate" : "Record Rate"}
                </Button>
              </div>
            </form>
            </div>
          </Modal>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


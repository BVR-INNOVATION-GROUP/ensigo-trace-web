"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { TrendingUp, Droplets, Sun, Plus, Edit } from "lucide-react";
import { mockNurseries, mockSeedBatches } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES } from "@/src/models/User";
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

  const myBatches = batches.filter((b) => b.germinationRate !== undefined);
  const avgGermination = myBatches.length > 0
    ? myBatches.reduce((acc, b) => acc + (b.germinationRate || 0), 0) / myBatches.length
    : 0;
  const highPerformers = myBatches.filter((b) => (b.germinationRate || 0) >= 80);
  const lowPerformers = myBatches.filter((b) => (b.germinationRate || 0) < 60);

  // Chart data
  const performanceChartData = useMemo(() => {
    return batches
      .filter(b => b.germinationRate !== undefined)
      .slice(0, 6)
      .map(b => ({
        label: b.species.substring(0, 12) + (b.species.length > 12 ? "..." : ""),
        value: b.germinationRate || 0,
      }));
  }, [batches]);

  const distributionChartData = useMemo(() => {
    const ranges = [
      { label: "Excellent (80-100%)", min: 80, max: 100 },
      { label: "Good (60-79%)", min: 60, max: 79 },
      { label: "Fair (40-59%)", min: 40, max: 59 },
      { label: "Poor (<40%)", min: 0, max: 39 },
    ];
    return ranges.map(range => ({
      label: range.label,
      value: myBatches.filter(b => (b.germinationRate || 0) >= range.min && (b.germinationRate || 0) <= range.max).length,
    }));
  }, [myBatches]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-primary";
    return "text-yellow-600";
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
    if (!selectedBatch) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const rate = parseFloat(germinationRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setIsSubmitting(false);
      return;
    }

    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id ? { ...b, germinationRate: rate } : b
      )
    );

    setIsSubmitting(false);
    handleCloseModal();
  };

  const columns: Column<SeedBatch>[] = [
    {
      key: "batchNumber",
      header: "Batch #",
      render: (item) => <span className="font-mono text-primary">{item.batchNumber}</span>,
    },
    {
      key: "species",
      header: "Species",
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "germinationRate",
      header: "Rate",
      render: (item) => {
        const rate = item.germinationRate;
        if (rate === undefined) {
          return <span className="text-[var(--very-dark-color)]/40">Not recorded</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="w-12 bg-pale rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-primary" : "bg-yellow-500"}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className={getPerformanceColor(rate)}>{rate}%</span>
          </div>
        );
      },
    },
    {
      key: "collectionDate",
      header: "Date",
      render: (item) => new Date(item.collectionDate).toLocaleDateString(),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-5 sm:py-6 min-h-[120px] sm:min-h-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-h4 mb-1">Germination Tracking</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Monitor germination rates and seedling health across batches
              </p>
            </div>
            <Button onClick={() => handleOpenModal(null)} className="min-h-[44px] justify-center sm:justify-start sm:flex-shrink-0">
              <Plus size={16} className="mr-2" />
              Record Germination
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Avg Germination"
              value={`${avgGermination.toFixed(1)}%`}
              icon={<TrendingUp size={20} />}
              index={0}
            />
            <SummaryCard
              title="High Performers"
              value={highPerformers.length}
              icon={<Sun size={20} />}
              index={1}
            />
            <SummaryCard
              title="Needs Attention"
              value={lowPerformers.length}
              icon={<Droplets size={20} />}
              index={2}
            />
            <SummaryCard
              title="Total Batches"
              value={batches.length}
              icon={<TrendingUp size={20} />}
              index={3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Germination by Species"
              description="Performance across different species"
              type="bar"
              data={performanceChartData}
            />
            <ChartCard
              title="Performance Distribution"
              description="Batches by germination rate range"
              type="donut"
              data={distributionChartData}
            />
          </div>

          {/* Data Table */}
          <DataTable
            data={batches}
            columns={columns}
            title="All Batches"
            description="Track and update germination rates"
            searchable
            searchPlaceholder="Search batches..."
            searchKeys={["batchNumber", "species"] as (keyof SeedBatch)[]}
            actions={(item) => (
              <Button
                size="sm"
                variant="pale"
                onClick={() => handleOpenModal(item)}
                title={item.germinationRate !== undefined ? "Update" : "Record"}
              >
                {item.germinationRate !== undefined ? <Edit size={14} /> : <Plus size={14} />}
              </Button>
            )}
            emptyMessage="No batches found"
          />

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedBatch?.germinationRate !== undefined ? "Update Germination Rate" : "Record Germination Rate"}
            size="md"
          >
            <div className="p-6">
              <form onSubmit={handleSubmitGermination} className="space-y-6">
                {selectedBatch ? (
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-label font-medium">{selectedBatch.species}</p>
                    <p className="text-caption text-[var(--very-dark-color)]/60">
                      Batch {selectedBatch.batchNumber} • {selectedBatch.quantity} {selectedBatch.unit}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-label mb-2">Select Batch *</label>
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
                  </div>
                )}

                <div>
                  <label className="block text-label mb-2">Germination Rate (%) *</label>
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
                  <p className="text-caption text-[var(--very-dark-color)]/50 mt-1">
                    Percentage of seeds that have successfully germinated
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                  <Button type="button" variant="pale" onClick={handleCloseModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={isSubmitting}>
                    {selectedBatch?.germinationRate !== undefined ? "Update Rate" : "Record Rate"}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

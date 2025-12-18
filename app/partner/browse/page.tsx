"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Search, CheckCircle, MapPin } from "lucide-react";
import { mockSeedBatches, mockMotherTrees, type SeedBatch } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";

export default function BrowseSeedsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<SeedBatch | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBatches = mockSeedBatches.filter(
    (b) => b.status === "approved" || b.status === "in-nursery"
  );

  const filteredBatches = availableBatches.filter((batch) => {
    const matchesSearch =
      batch.species.toLowerCase().includes(search.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleOrder = (batch: SeedBatch) => {
    setSelectedBatch(batch);
    setOrderFormData({
      quantity: batch.quantity.toString(),
      notes: "",
    });
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setSelectedBatch(null);
    setOrderFormData({ quantity: "", notes: "" });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const quantity = parseFloat(orderFormData.quantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > selectedBatch.quantity) {
      alert(`Please enter a valid quantity between 0 and ${selectedBatch.quantity}`);
      setIsSubmitting(false);
      return;
    }

    // Redirect to checkout page
    const checkoutParams = new URLSearchParams({
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      species: selectedBatch.species,
      quantity: quantity.toString(),
      unit: selectedBatch.unit,
    });

    router.push(`/partner/checkout?${checkoutParams.toString()}`);
  };

  return (
    <ProtectedRoute allowedRoles={["partner"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">Browse Native Seeds</h1>
            <p className="text-caption opacity-75">
              Explore available seed batches with verified provenance
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                    />
                    <Input
                      placeholder="Search by species or batch number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {filteredBatches.map((batch) => {
              const motherTree = mockMotherTrees.find((t) => t.id === batch.motherTreeId);

              return (
                <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-h5">{batch.species}</CardTitle>
                          <Badge className="bg-primary/10 text-primary">Available</Badge>
                        </div>
                        <CardDescription>Batch {batch.batchNumber}</CardDescription>
                      </div>
                      <Button onClick={() => handleOrder(batch)}>
                        <ShoppingCart size={16} className="mr-2" />
                        Request Order
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-pale rounded-lg">
                          <p className="text-caption opacity-75 mb-1">Quantity Available</p>
                          <p className="text-label">
                            {batch.quantity} {batch.unit}
                          </p>
                        </div>
                        {batch.germinationRate && (
                          <div className="p-3 bg-pale rounded-lg">
                            <p className="text-caption opacity-75 mb-1">Germination Rate</p>
                            <p className="text-label text-primary">{batch.germinationRate}%</p>
                          </div>
                        )}
                        <div className="p-3 bg-pale rounded-lg">
                          <p className="text-caption opacity-75 mb-1">Collection Date</p>
                          <p className="text-label">{batch.collectionDate}</p>
                        </div>
                        <div className="p-3 bg-pale rounded-lg">
                          <p className="text-caption opacity-75 mb-1">Region</p>
                          <p className="text-label text-xs">{batch.region}</p>
                        </div>
                      </div>

                      {motherTree && (
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={18} className="text-primary" />
                            <h4 className="text-label font-medium">Verified Provenance</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-sm">
                            <div>
                              <p className="text-caption opacity-75">Mother Tree</p>
                              <p className="text-label">{motherTree.id}</p>
                            </div>
                            <div>
                              <p className="text-caption opacity-75">Age</p>
                              <p className="text-label">{motherTree.age} years</p>
                            </div>
                            <div>
                              <p className="text-caption opacity-75">Health Status</p>
                              <p className="text-label text-primary capitalize">
                                {motherTree.healthStatus}
                              </p>
                            </div>
                            <div>
                              <p className="text-caption opacity-75">Ecological Zone</p>
                              <p className="text-label text-xs">{motherTree.ecologicalZone}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-caption opacity-75">
                            <MapPin size={14} />
                            <span>
                              GPS: {batch.gpsCoordinates.lat.toFixed(4)}, {batch.gpsCoordinates.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredBatches.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-caption opacity-75">
                  No seeds available matching your search.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Request Modal */}
          <Modal
            isOpen={isOrderModalOpen}
            onClose={handleCloseOrderModal}
            title="Request Seed Order"
            size="md"
          >
            <div className="p-6">
              {selectedBatch && (
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-caption opacity-75">Batch Information</p>
                    <div className="p-4 bg-pale rounded-lg">
                      <p className="text-label font-medium">{selectedBatch.species}</p>
                      <p className="text-caption opacity-75">
                        Batch {selectedBatch.batchNumber} • Available: {selectedBatch.quantity} {selectedBatch.unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Requested Quantity ({selectedBatch.unit}) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={selectedBatch.quantity}
                      step={selectedBatch.unit === "kg" ? "0.01" : "1"}
                      placeholder={`Enter quantity (max: ${selectedBatch.quantity} ${selectedBatch.unit})`}
                      value={orderFormData.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        if (value === "" || (numValue >= 0 && numValue <= selectedBatch.quantity)) {
                          setOrderFormData({ ...orderFormData, quantity: value });
                        }
                      }}
                      required
                    />
                    <p className="text-caption opacity-75">
                      Maximum available: {selectedBatch.quantity} {selectedBatch.unit}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label mb-2">Order Notes</label>
                    <Textarea
                      placeholder="Add any special requirements or notes for this order..."
                      value={orderFormData.notes}
                      onChange={(e) =>
                        setOrderFormData({ ...orderFormData, notes: e.target.value })
                      }
                      rows={3}
                    />
                    <p className="text-caption opacity-75">
                      Optional notes about delivery preferences or special requirements
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseOrderModal}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Submit Order Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


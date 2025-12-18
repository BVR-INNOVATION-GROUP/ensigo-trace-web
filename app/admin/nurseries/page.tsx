"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sprout, MapPin, Package, Activity, Plus, CheckCircle } from "lucide-react";
import { mockNurseries, mockSeedBatches, type Nursery } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";

export default function NurseriesPage() {
  const [nurseries, setNurseries] = useState(mockNurseries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    operator: "",
    capacity: "",
    latitude: "",
    longitude: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setFormData({
      name: "",
      location: "",
      operator: "",
      capacity: "",
      latitude: "",
      longitude: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      location: "",
      operator: "",
      capacity: "",
      latitude: "",
      longitude: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newNursery: Nursery = {
      id: `NUR-${String(nurseries.length + 1).padStart(3, "0")}`,
      name: formData.name,
      location: formData.location,
      operator: formData.operator,
      capacity: parseInt(formData.capacity),
      currentStock: 0,
      activeBatches: 0,
      gpsCoordinates: {
        lat: parseFloat(formData.latitude) || 0,
        lng: parseFloat(formData.longitude) || 0,
      },
    };

    setNurseries([...nurseries, newNursery]);
    setIsSubmitting(false);
    handleCloseModal();
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-h4 mb-2">Nursery Network</h1>
              <p className="text-caption opacity-75">
                Monitor and manage all nurseries in the West Nile region
              </p>
            </div>
            <Button onClick={handleOpenModal}>
              <Plus size={16} className="mr-2" />
              Add Nursery
            </Button>
          </div>

          <div className="grid gap-6">
            {nurseries.map((nursery) => {
              const capacityPercent = (nursery.currentStock / nursery.capacity) * 100;
              const nurseryBatches = mockSeedBatches.filter((b) => b.nurseryId === nursery.id);

              return (
                <Card key={nursery.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-h5 flex items-center gap-2">
                          <Sprout size={18} className="text-primary" />
                          {nursery.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin size={14} />
                          {nursery.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-caption opacity-75">Operator</p>
                        <p className="text-label font-medium">{nursery.operator}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-label font-medium">Capacity Usage</span>
                          <span className="text-body-sm opacity-75">
                            {nursery.currentStock.toLocaleString()} / {nursery.capacity.toLocaleString()} seedlings
                          </span>
                        </div>
                        <div className="w-full bg-pale rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${capacityPercent}%` }}
                            transition={{ duration: 0.5 }}
                            className="bg-primary h-2 rounded-full"
                          />
                        </div>
                        <p className="text-caption opacity-75 mt-1">
                          {capacityPercent.toFixed(1)}% capacity utilized
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                          <Package size={18} className="text-primary" />
                          <div>
                            <p className="text-caption opacity-75">Active Batches</p>
                            <p className="text-label font-medium">{nursery.activeBatches}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                          <Activity size={18} className="text-primary" />
                          <div>
                            <p className="text-caption opacity-75">Current Stock</p>
                            <p className="text-label font-medium">
                              {(nursery.currentStock / 1000).toFixed(1)}k
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                          <Sprout size={18} className="text-primary" />
                          <div>
                            <p className="text-caption opacity-75">Max Capacity</p>
                            <p className="text-label font-medium">
                              {(nursery.capacity / 1000).toFixed(0)}k
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-pale rounded-lg">
                          <MapPin size={18} className="text-primary" />
                          <div>
                            <p className="text-caption opacity-75">Location</p>
                            <p className="text-label text-xs">
                              {nursery.gpsCoordinates.lat.toFixed(2)}, {nursery.gpsCoordinates.lng.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {nurseryBatches.length > 0 && (
                        <div>
                          <h4 className="text-label font-medium mb-3">Active Seed Batches</h4>
                          <div className="space-y-2">
                            {nurseryBatches.map((batch) => (
                              <div
                                key={batch.id}
                                className="flex items-center justify-between p-3 bg-pale rounded-lg"
                              >
                                <div>
                                  <p className="text-label font-medium">{batch.species}</p>
                                  <p className="text-caption opacity-75">
                                    Batch {batch.batchNumber}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {batch.germinationRate && (
                                    <p className="text-body-sm text-primary font-medium">
                                      {batch.germinationRate}% germination
                                    </p>
                                  )}
                                  <p className="text-caption opacity-75">
                                    {batch.quantity} {batch.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Nursery Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Add New Nursery"
            size="md"
          >
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Nursery Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter nursery name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter location (e.g., Arua District)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Operator Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter operator name"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Capacity (seedlings) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter maximum capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">Latitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="GPS Latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">Longitude</label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="GPS Longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
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
                    {isSubmitting ? (
                      "Creating..."
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Create Nursery
                      </>
                    )}
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


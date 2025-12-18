"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Calendar, MapPin, TrendingUp, Plus, CheckCircle } from "lucide-react";
import { mockRestorationProjects, type RestorationProject } from "@/src/data/mockData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { useUser } from "@/src/hooks/useUser";

export default function PartnerProjectsPage() {
  const { user } = useUser();
  const [allProjects, setAllProjects] = useState(mockRestorationProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    targetTrees: "",
    startDate: "",
    species: "",
    status: "planning",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-accent/10 text-accent",
      active: "bg-primary/10 text-primary",
      completed: "bg-primary/10 text-primary",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  // Filter projects for the current partner
  const myProjects = allProjects.filter(
    (project) => project.partner === user?.name || project.partner.toLowerCase().includes(user?.name?.toLowerCase() || "")
  );

  const handleOpenModal = () => {
    setFormData({
      name: "",
      location: "",
      targetTrees: "",
      startDate: "",
      species: "",
      status: "planning",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      location: "",
      targetTrees: "",
      startDate: "",
      species: "",
      status: "planning",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newProject: RestorationProject = {
      id: `RP-${String(allProjects.length + 1).padStart(3, "0")}`,
      name: formData.name,
      partner: user?.name || "Unknown Partner",
      location: formData.location,
      targetTrees: parseInt(formData.targetTrees),
      plantedTrees: 0,
      species: formData.species.split(",").map((s) => s.trim()).filter(Boolean),
      startDate: formData.startDate,
      status: formData.status as "planning" | "active" | "completed",
    };

    setAllProjects([...allProjects, newProject]);
    setIsSubmitting(false);
    handleCloseModal();
  };

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
              <h1 className="text-h4 mb-2">My Projects</h1>
              <p className="text-caption opacity-75">
                Track progress of your restoration initiatives
              </p>
            </div>
            <Button onClick={handleOpenModal}>
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>

          {myProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Target size={48} className="mx-auto mb-4 text-[var(--placeholder)]" />
                  <p className="text-label mb-2">No projects found</p>
                  <p className="text-caption opacity-75">
                    You don't have any active restoration projects yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {myProjects.map((project) => {
                const progressPercent = (project.plantedTrees / project.targetTrees) * 100;

                return (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-h5">{project.name}</CardTitle>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          <CardDescription>{project.location}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-label font-medium">Planting Progress</span>
                            <span className="text-body-sm opacity-75">
                              {project.plantedTrees.toLocaleString()} / {project.targetTrees.toLocaleString()} trees
                            </span>
                          </div>
                          <div className="w-full bg-pale rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.5 }}
                              className="bg-primary h-2 rounded-full"
                            />
                          </div>
                          <p className="text-caption opacity-75 mt-1">
                            {progressPercent.toFixed(1)}% complete
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-start gap-3 p-4 bg-pale rounded-lg">
                            <Target size={18} className="text-primary mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-caption opacity-75 mb-1">Target Trees</p>
                              <p className="text-label font-medium">
                                {project.targetTrees.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-4 bg-pale rounded-lg">
                            <Calendar size={18} className="text-primary mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-caption opacity-75 mb-1">Start Date</p>
                              <p className="text-label font-medium">{project.startDate}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-4 bg-pale rounded-lg">
                            <MapPin size={18} className="text-primary mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-caption opacity-75 mb-1">Location</p>
                              <p className="text-label font-medium">{project.location}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-label font-medium mb-3">Native Species Planted</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.species.map((species, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-primary/5 border-primary/20"
                              >
                                {species}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--very-dark-color)]/10">
                          <div className="text-center">
                            <p className="text-h5 text-primary">{project.species.length}</p>
                            <p className="text-caption opacity-75">Species Diversity</p>
                          </div>
                          <div className="text-center">
                            <p className="text-h5 text-primary">
                              {((project.plantedTrees * 0.035) / 1000).toFixed(1)}t
                            </p>
                            <p className="text-caption opacity-75">CO₂ Captured</p>
                          </div>
                          <div className="text-center">
                            <p className="text-h5 text-primary">
                              {progressPercent.toFixed(0)}%
                            </p>
                            <p className="text-caption opacity-75">Completion</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add Project Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Create New Project"
            size="lg"
          >
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter project name"
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
                    placeholder="Enter project location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Target Trees <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter target number"
                      value={formData.targetTrees}
                      onChange={(e) => setFormData({ ...formData, targetTrees: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Species (comma-separated) <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Enter species names separated by commas (e.g., Albizia coriaria, Markhamia lutea)"
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-label mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-paper border border-[var(--very-dark-color)]/10 rounded-md text-label"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
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
                        Create Project
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


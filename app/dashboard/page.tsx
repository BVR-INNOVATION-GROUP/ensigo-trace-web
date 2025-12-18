"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SeedBatchTable } from "@/components/dashboard/seed-batch-table";
import { SeedCollectionService } from "@/src/services/SeedCollection";
import { CollectionDetailsModal } from "@/components/dashboard/collection-details-modal";
import { CollectionFormModal } from "@/components/dashboard/collection-form-modal";
import { FileText, RefreshCw, List, Plus } from "lucide-react";
import type { SeedCollectionI } from "@/src/models/SeedCollection";

export default function DashboardPage() {
    const [collections, setCollections] = useState<SeedCollectionI[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<SeedCollectionI | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<SeedCollectionI | null>(null);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("Vincent");

    const seedService = new SeedCollectionService();

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.name || "Vincent");
        }
        loadCollections();
    }, []);

    const loadCollections = async () => {
        const data = await seedService.getAllCollections();
        setCollections(data);
    };

    const handleView = (collection: SeedCollectionI) => {
        setSelectedCollection(collection);
        setIsModalOpen(true);
    };

    const handleEdit = (collection: SeedCollectionI) => {
        setEditingCollection(collection);
        setIsFormModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCollection(null);
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = async (data: Omit<SeedCollectionI, "id">) => {
        setLoading(true);
        try {
            let result;
            if (editingCollection) {
                result = await seedService.updateCollection(editingCollection.id, data);
            } else {
                result = await seedService.addCollection(data);
            }

            if (result.success) {
                setIsFormModalOpen(false);
                setEditingCollection(null);
                await loadCollections();
            }
        } catch (error) {
            console.error("Error saving collection:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalCollections = collections.length;
    const pendingReviews = Math.floor(totalCollections * 0.75);
    const approved = totalCollections - pendingReviews;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between mb-2">
                    <motion.h1
                        className="text-h4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {getGreeting()}, <span>{userName}</span>
                    </motion.h1>
                    <motion.button
                        onClick={handleAdd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-dark text-white text-body font-medium transition-all"
                    >
                        <Plus size={16} />
                        Add Collection
                    </motion.button>
                </div>
                <motion.p
                    className="text-body mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    Track your seed collection batches and submissions.
                </motion.p>

                <div className="grid grid-cols-3 gap-6 mb-8">
                    <SummaryCard
                        title="Total Collections"
                        value={totalCollections}
                        icon={<FileText size={18} />}
                        cardImage={1}
                        index={0}
                    />
                    <SummaryCard
                        title="Pending Reviews"
                        value={pendingReviews}
                        icon={<RefreshCw size={18} />}
                        cardImage={2}
                        index={1}
                    />
                    <SummaryCard
                        title="Approved"
                        value={approved}
                        icon={<List size={18} />}
                        cardImage={3}
                        index={2}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <SeedBatchTable
                        collections={collections}
                        onView={handleView}
                        onEdit={handleEdit}
                    />
                </motion.div>
            </motion.div>

            {isModalOpen && selectedCollection && (
                <CollectionDetailsModal
                    collection={selectedCollection}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            <CollectionFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingCollection(null);
                }}
                collection={editingCollection || undefined}
                onSubmit={handleFormSubmit}
                loading={loading}
            />
        </DashboardLayout>
    );
}


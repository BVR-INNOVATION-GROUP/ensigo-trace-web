"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SeedBatchTable } from "@/components/dashboard/seed-batch-table";
import { SeedCollectionService } from "@/src/services/SeedCollection";
import { CollectionDetailsModal } from "@/components/dashboard/collection-details-modal";
import { CollectionFormModal } from "@/components/dashboard/collection-form-modal";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { FileText, RefreshCw, List, Plus, MapPin, Bell, Loader2 } from "lucide-react";
import type { SeedCollectionI, CollectorStats, LocationPoint } from "@/src/models/SeedCollection";
import { SeedCollectionRepository } from "@/src/repositories/SeedRepository";
import api from "@/src/api/client";

// Dynamically import the map to avoid SSR issues
const CollectionLocationsMap = dynamic(
    () => import("@/components/dashboard/collection-locations-map"),
    { 
        ssr: false,
        loading: () => (
            <div className="h-[300px] bg-pale rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }
);

export default function DashboardPage() {
    const [collections, setCollections] = useState<SeedCollectionI[]>([]);
    const [stats, setStats] = useState<CollectorStats | null>(null);
    const [locations, setLocations] = useState<LocationPoint[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<SeedCollectionI | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<SeedCollectionI | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState("Collector");
    const [showMap, setShowMap] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const seedService = new SeedCollectionService();
    const seedRepo = new SeedCollectionRepository();

    const loadCollections = useCallback(async (showSpinner = true) => {
        if (showSpinner) setRefreshing(true);
        try {
            const [data, statsData, locationsData] = await Promise.all([
                seedService.getAllCollections(),
                seedRepo.getStats(),
                seedRepo.getLocations(),
            ]);
            setCollections(data ?? []);
            setStats(statsData);
            setLocations(locationsData ?? []);
        } catch (error) {
            console.error("Error loading collections:", error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const result = await api.getUnreadNotificationCount();
            setUnreadCount(result.count);
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    }, []);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.name || "Collector");
        }
        loadCollections();
        fetchUnreadCount();

        // Set up polling for real-time updates (every 30 seconds)
        const interval = setInterval(() => {
            loadCollections(false);
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [loadCollections, fetchUnreadCount]);

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
                // Immediately refresh to show updated stats
                await loadCollections();
            }
        } catch (error) {
            console.error("Error saving collection:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadCollections();
    };

    // Use real stats if available, otherwise calculate from collections
    const totalCollections = stats?.total_collections ?? collections.length;
    const pendingReviews = stats?.pending_reviews ?? collections.filter(c => c.status === "pending").length;
    const approved = stats?.approved ?? collections.filter(c => c.status === "approved").length;

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
                className="pb-8"
            >
                {/* Header - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <motion.h1
                        className="text-xl sm:text-h4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {getGreeting()}, <span className="text-primary">{userName}</span>
                    </motion.h1>
                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => setIsNotificationsOpen(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-pale hover:bg-pale-dark transition-all relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </motion.button>
                        <motion.button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-pale hover:bg-pale-dark transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
                        </motion.button>
                        <motion.button
                            onClick={handleAdd}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-dark text-white text-body font-medium transition-all"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Add Collection</span>
                        </motion.button>
                    </div>
                </div>
                <motion.p
                    className="text-body mb-6 sm:mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    Track your seed collection batches and submissions.
                </motion.p>

                {/* Summary Cards - Mobile Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

                {/* Collection Locations Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                    className="mb-6 sm:mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin size={20} className="text-primary" />
                            Collection Locations
                        </h2>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="text-sm text-primary hover:underline"
                        >
                            {showMap ? "Hide Map" : "Show Map"}
                        </button>
                    </div>
                    {showMap && (
                        <CollectionLocationsMap
                            locations={locations ?? []}
                            collections={collections.map(c => ({
                                ...c,
                                collection_date: c.collection_date || c.submitted_at || new Date().toISOString(),
                                collection_number: c.collection_number || c.id,
                                status: c.status || "pending",
                                collector_id: c.collector_id || "",
                                submitted_at: c.submitted_at || new Date().toISOString(),
                            }))}
                            height="300px"
                            showClusters={(locations?.length ?? 0) > 5}
                        />
                    )}
                </motion.div>

                {/* Collections Table */}
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

            {/* Modals */}
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

            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => {
                    setIsNotificationsOpen(false);
                    fetchUnreadCount();
                }}
            />
        </DashboardLayout>
    );
}

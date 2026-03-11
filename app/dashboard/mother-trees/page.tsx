"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import {
    TreeDeciduous,
    Plus,
    Search,
    MapPin,
    Filter,
    Loader2,
    Calendar,
    Ruler,
    Heart,
} from "lucide-react";
import api, { MotherTree, Species } from "@/src/api/client";
import { useSpecies } from "@/src/hooks/useSpecies";

const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

export default function MotherTreesPage() {
    const [trees, setTrees] = useState<MotherTree[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");

    const { species } = useSpecies();

    const fetchTrees = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.getMotherTrees({ limit: 500 });
            setTrees(response.data);
        } catch (err) {
            console.error("Error fetching mother trees:", err);
            // Fallback to mock data
            setTrees(mockMotherTrees);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrees();
        // Load Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, [fetchTrees]);

    // Filter trees
    const filteredTrees = trees.filter((tree) => {
        const matchesSearch =
            !searchQuery ||
            tree.tree_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tree.species?.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tree.region?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSpecies = !selectedSpecies || tree.species_id === selectedSpecies;
        const matchesRegion = !selectedRegion || tree.region === selectedRegion;

        return matchesSearch && matchesSpecies && matchesRegion;
    });

    // Get unique regions
    const regions = [...new Set(trees.map((t) => t.region).filter(Boolean))];

    const speciesOptions = species.map((s) => ({
        value: s.id,
        label: s.scientific_name,
    }));

    const regionOptions = regions.map((r) => ({
        value: r as string,
        label: r as string,
    }));

    const getHealthColor = (status?: string) => {
        switch (status) {
            case "excellent":
                return "bg-green-100 text-green-700";
            case "good":
                return "bg-blue-100 text-blue-700";
            case "fair":
                return "bg-yellow-100 text-yellow-700";
            case "poor":
                return "bg-red-100 text-red-700";
            default:
                return "bg-pale text-[var(--very-dark-color)]";
        }
    };

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-h4 flex items-center gap-2">
                            <TreeDeciduous className="text-primary" />
                            Mother Trees Database
                        </h1>
                        <p className="text-body mt-1">
                            {trees.length} registered mother trees across all regions
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white"
                    >
                        <Plus size={16} className="mr-2" />
                        Register Tree
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-[var(--very-dark-color)]/10">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--very-dark-color)]/40" />
                                <Input
                                    placeholder="Search by ID, species, or region..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <CustomSelect
                                name="species"
                                value={selectedSpecies}
                                onChange={setSelectedSpecies}
                                options={[{ value: "", label: "All Species" }, ...speciesOptions]}
                                placeholder="Filter by species"
                            />
                            <CustomSelect
                                name="region"
                                value={selectedRegion}
                                onChange={setSelectedRegion}
                                options={[{ value: "", label: "All Regions" }, ...regionOptions]}
                                placeholder="Filter by region"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                onClick={() => setViewMode("list")}
                                className={viewMode === "list" ? "bg-primary text-white" : ""}
                            >
                                <Filter size={16} />
                            </Button>
                            <Button
                                variant={viewMode === "map" ? "default" : "outline"}
                                onClick={() => setViewMode("map")}
                                className={viewMode === "map" ? "bg-primary text-white" : ""}
                            >
                                <MapPin size={16} />
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : viewMode === "map" ? (
                    /* Map View */
                    <div className="h-[500px] rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10">
                        <MapContainer
                            center={[3.0, 30.9]}
                            zoom={8}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredTrees.map((tree) => (
                                <Marker
                                    key={tree.id}
                                    position={[tree.latitude, tree.longitude]}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-bold">{tree.tree_id}</p>
                                            <p>{tree.species?.scientific_name}</p>
                                            <p className="text-[var(--very-dark-color)]/50">{tree.region}</p>
                                            <p className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${getHealthColor(tree.health_status)}`}>
                                                {tree.health_status}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                ) : (
                    /* List View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTrees.map((tree, index) => (
                            <motion.div
                                key={tree.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-lg p-4 shadow-sm border border-[var(--very-dark-color)]/10 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                                            {tree.tree_id}
                                        </span>
                                        <h3 className="font-semibold mt-2">
                                            {tree.species?.scientific_name || "Unknown Species"}
                                        </h3>
                                        {tree.species?.common_name && (
                                            <p className="text-sm text-[var(--very-dark-color)]/50">
                                                {tree.species.common_name}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getHealthColor(tree.health_status)}`}>
                                        {tree.health_status || "unknown"}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-[var(--very-dark-color)]/60">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} />
                                        <span>{tree.region || tree.district || "Unknown location"}</span>
                                    </div>
                                    {tree.age && (
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>{tree.age} years old</span>
                                        </div>
                                    )}
                                    {tree.height && (
                                        <div className="flex items-center gap-2">
                                            <Ruler size={14} />
                                            <span>{tree.height}m height</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Heart size={14} />
                                        <span>{tree.total_collections || 0} collections</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[var(--very-dark-color)]/10 flex justify-between items-center">
                                    <span className="text-xs text-[var(--very-dark-color)]/40">
                                        Registered {new Date(tree.registered_date).toLocaleDateString()}
                                    </span>
                                    <Button variant="pale" size="sm">
                                        View Details
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {filteredTrees.length === 0 && !loading && (
                    <div className="text-center py-12 text-[var(--very-dark-color)]/50">
                        <TreeDeciduous size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No mother trees found matching your criteria</p>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}

// Mock data for fallback
const mockMotherTrees: MotherTree[] = [
    {
        id: "1",
        tree_id: "MT-00001",
        species_id: "1",
        species: { id: "1", scientific_name: "Albizia coriaria", common_name: "Chester Wood" },
        latitude: 3.0324,
        longitude: 30.9108,
        region: "West Nile",
        district: "Arua",
        age: 25,
        height: 18,
        health_status: "excellent",
        total_collections: 12,
        registered_date: "2024-06-15",
    },
    {
        id: "2",
        tree_id: "MT-00002",
        species_id: "2",
        species: { id: "2", scientific_name: "Markhamia lutea", common_name: "Nile Tulip" },
        latitude: 3.0456,
        longitude: 30.9234,
        region: "West Nile",
        district: "Arua",
        age: 18,
        height: 15,
        health_status: "good",
        total_collections: 8,
        registered_date: "2024-07-20",
    },
    {
        id: "3",
        tree_id: "MT-00003",
        species_id: "3",
        species: { id: "3", scientific_name: "Khaya anthotheca", common_name: "East African Mahogany" },
        latitude: 3.0201,
        longitude: 30.8987,
        region: "West Nile",
        district: "Maracha",
        age: 40,
        height: 25,
        health_status: "excellent",
        total_collections: 15,
        registered_date: "2024-08-10",
    },
];

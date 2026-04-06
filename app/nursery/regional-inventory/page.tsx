"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDataItem } from "@/components/dashboard/chart-card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES, type UserRole } from "@/src/models/User";
import api, { Nursery, SeedBatch, User, InventoryRequest } from "@/src/api/client";
import {
  Package,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X,
  Check,
  Loader2
} from "lucide-react";

type InventoryRow = SeedBatch & {
  species_label: string;
  quantity_label: string;
  received_label: string;
  unit_cost_label: string;
};

type InventoryStats = {
  total_batches: number;
  total_quantity: number;
  species_diversity: number;
  low_stock_alerts: number;
  pending_requests: number;
  capacity_utilization: number;
  regional_distribution: ChartDataItem[];
  species_distribution: ChartDataItem[];
  status_distribution: ChartDataItem[];
};

export default function RegionalInventoryPage() {
  const router = useRouter();
  const [myNursery, setMyNursery] = useState<Nursery | null>(null);
  const [batches, setBatches] = useState<SeedBatch[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<InventoryRequest[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<typeof NURSERY_ROLES[number] | null>(null);

  // Filters and search
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("received_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Temporary filter states for UI
  const [tempStatuses, setTempStatuses] = useState<string[]>([]);
  const [tempRegions, setTempRegions] = useState<string[]>([]);
  const [tempSpecies, setTempSpecies] = useState<string[]>([]);

  // Search debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resolveMyNursery = useCallback(async (currentUser: User & { nursery_id?: string; business_name?: string }) => {
    const typeMap: Record<UserRole, "regional" | "super" | "community"> = {
      regional_nursery: "regional",
      super_nursery: "super",
      community_nursery: "community",
      collector: "community",
      partner: "community",
      admin: "regional",
    };
    const type = typeMap[currentUser.role];
    const result = await api.getNurseries({ type, limit: 500, offset: 0 });
    const rows = result.data || [];
    return (
      rows.find((n) => n.operator_id === currentUser.id) ||
      rows.find((n) => n.id === currentUser.nursery_id || n.nursery_id === currentUser.nursery_id) ||
      rows.find(
        (n) =>
          (n.contact_email && currentUser.email && n.contact_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (n.name && currentUser.business_name && n.name.toLowerCase() === currentUser.business_name.toLowerCase())
      ) ||
      rows.find((n) => n.region && currentUser.region && n.region.toLowerCase() === currentUser.region.toLowerCase()) ||
      (rows.length === 1 ? rows[0] : null)
    );
  }, []);

  const loadInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const current = JSON.parse(raw) as User & { nursery_id?: string; business_name?: string };
      setCurrentRole(current.role ?? null);

      if (current.role !== "regional_nursery") {
        setError("Access denied. This page is for regional nursery operators only.");
        return;
      }

      const nursery = await resolveMyNursery(current);
      setMyNursery(nursery);
      if (!nursery) {
        setError("No regional nursery context found for your account.");
        return;
      }

      // Load regional inventory data
      const [batchesResponse, requestsResponse] = await Promise.all([
        api.getNurseryBatches(nursery.id, { limit: 1000, offset: 0 }),
        api.getInventoryRequests({ nursery_id: nursery.id, limit: 100, offset: 0 })
      ]);

      setBatches(batchesResponse.data || []);
      setInventoryRequests(requestsResponse.data || []);

      // Calculate stats
      const totalBatches = batchesResponse.data?.length || 0;
      const totalQuantity = batchesResponse.data?.reduce((sum: number, b: SeedBatch) => sum + (b.current_quantity || 0), 0) || 0;
      const speciesSet = new Set(batchesResponse.data?.map(b => b.species?.scientific_name || b.species_name).filter(Boolean));
      const lowStock = batchesResponse.data?.filter((b: SeedBatch) => (b.current_quantity || 0) < 500).length || 0;
      const pendingRequests = requestsResponse.data?.filter((r: InventoryRequest) => r.status === "pending").length || 0;

      // Regional distribution
      const regionMap: Record<string, number> = {};
      batchesResponse.data?.forEach((batch: SeedBatch) => {
        const region = batch.nursery?.region || "Unknown";
        regionMap[region] = (regionMap[region] || 0) + (batch.current_quantity || 0);
      });

      // Species distribution
      const speciesMap: Record<string, number> = {};
      batchesResponse.data?.forEach((batch: SeedBatch) => {
        const species = batch.species?.scientific_name || batch.species_name || "Unknown";
        speciesMap[species] = (speciesMap[species] || 0) + (batch.current_quantity || 0);
      });

      // Status distribution
      const statusMap: Record<string, number> = {};
      batchesResponse.data?.forEach((batch: SeedBatch) => {
        const status = batch.status || "unknown";
        statusMap[status] = (statusMap[status] || 0) + 1;
      });

      setStats({
        total_batches: totalBatches,
        total_quantity: totalQuantity,
        species_diversity: speciesSet.size,
        low_stock_alerts: lowStock,
        pending_requests: pendingRequests,
        capacity_utilization: nursery.capacity ? Math.round((totalQuantity / nursery.capacity) * 100) : 0,
        regional_distribution: Object.entries(regionMap).map(([region, quantity]) => ({ label: region, value: quantity })),
        species_distribution: Object.entries(speciesMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([species, quantity]) => ({ label: species, value: quantity })),
        status_distribution: Object.entries(statusMap).map(([status, count]) => ({ label: status, value: count }))
      });

    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading regional inventory data");
    } finally {
      setLoading(false);
    }
  }, [resolveMyNursery]);

  useEffect(() => {
    void loadInventoryData();
  }, [loadInventoryData]);

  // Get unique filter options
  const uniqueRegions = useMemo(() => {
    const regions = new Set(batches.map(b => b.nursery?.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [batches]);

  const uniqueSpecies = useMemo(() => {
    const species = new Set(batches.map(b => b.species?.scientific_name || b.species_name).filter(Boolean));
    return Array.from(species).sort();
  }, [batches]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(batches.map(b => b.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [batches]);

  // Clear filters
  const clearFilters = () => {
    setTempStatuses([]);
    setTempRegions([]);
    setTempSpecies([]);
    setShowFilters(false);
  };

  // Apply filters
  const applyFilters = async () => {
    setSelectedStatuses(tempStatuses);
    setSelectedRegions(tempRegions);
    setSelectedSpecies(tempSpecies);
    setShowFilters(false);
    setFiltersLoading(true);
    // Simulate loading for better UX
    setTimeout(() => setFiltersLoading(false), 300);
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Search logic is handled by the useMemo above
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Filter and sort data
  const filteredAndSortedBatches = useMemo(() => {
    let filtered = batches.filter(batch => {
      const matchesSearch = search === "" ||
        (batch.batch_number && batch.batch_number.toLowerCase().includes(search.toLowerCase())) ||
        (batch.species?.scientific_name && batch.species.scientific_name.toLowerCase().includes(search.toLowerCase())) ||
        (batch.species_name && batch.species_name.toLowerCase().includes(search.toLowerCase())) ||
        (batch.nursery?.name && batch.nursery.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(batch.status || "");
      const matchesRegion = selectedRegions.length === 0 || (batch.nursery?.region && selectedRegions.includes(batch.nursery.region));
      const matchesSpecies = selectedSpecies.length === 0 ||
        selectedSpecies.includes(batch.species?.scientific_name || batch.species_name || "");

      return matchesSearch && matchesStatus && matchesRegion && matchesSpecies;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "batch_number":
          aValue = a.batch_number || "";
          bValue = b.batch_number || "";
          break;
        case "current_quantity":
          aValue = a.current_quantity || 0;
          bValue = b.current_quantity || 0;
          break;
        case "received_date":
          aValue = a.received_date || "";
          bValue = b.received_date || "";
          break;
        case "species_name":
          aValue = a.species?.scientific_name || a.species_name || "";
          bValue = b.species?.scientific_name || b.species_name || "";
          break;
        default:
          aValue = a.received_date || "";
          bValue = b.received_date || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [batches, search, selectedStatuses, selectedRegions, selectedSpecies, sortBy, sortOrder]);

  const rows = useMemo<InventoryRow[]>(
    () =>
      filteredAndSortedBatches.map((b) => ({
        ...b,
        species_label: b.species?.scientific_name || b.species_name || "-",
        quantity_label: `${b.current_quantity} ${b.unit}`,
        received_label: b.received_date ? new Date(b.received_date).toLocaleDateString() : "-",
        unit_cost_label: b.unit_cost ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: b.currency || 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(b.unit_cost) : "-",
      })),
    [filteredAndSortedBatches]
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      approved: "bg-primary/10 text-primary",
      in_nursery: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      "in-nursery": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      distributed: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      planted: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return colors[status] || "bg-pale text-[var(--very-dark-color)]";
  };

  const columns = useMemo<Column<InventoryRow>[]>(
    () => [
      { key: "batch_number", header: "Batch #" },
      { key: "species_label", header: "Species" },
      { key: "quantity_label", header: "Quantity" },
      { key: "unit_cost_label", header: "Unit Cost" },
      {
        key: "status",
        header: "Status",
        render: (item) => <Badge className={getStatusColor(item.status)}>{(item.status || "-").replace("_", " ")}</Badge>,
      },
      { key: "received_label", header: "Received" },
    ],
    []
  );

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleExport = () => {
    // Export functionality to be implemented
    console.log("Export inventory data");
  };

  return (
    <ProtectedRoute allowedRoles={["regional_nursery"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Package className="text-primary" size={24} />
                <h1 className="text-h4">Regional Inventory Management</h1>
              </div>
              <p className="text-caption opacity-70">
                {myNursery ? `Comprehensive inventory overview for ${myNursery.name} region` : "Monitor and manage inventory across all nurseries in your region"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="pale" onClick={loadInventoryData} disabled={loading}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Batches"
              value={stats?.total_batches || 0}
              icon={<Package size={20} />}
              index={0}
            />
            <SummaryCard
              title="Total Inventory"
              value={stats?.total_quantity?.toLocaleString() || 0}
              icon={<TrendingUp size={20} />}
              index={1}
            />
            <SummaryCard
              title="Species Diversity"
              value={stats?.species_diversity || 0}
              icon={<TrendingUp size={20} />}
              index={2}
            />
            <SummaryCard
              title="Pending Requests"
              value={stats?.pending_requests || 0}
              icon={<AlertCircle size={20} />}
              index={3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title="Regional Distribution"
              description="Inventory quantities by region"
              type="donut"
              data={stats?.regional_distribution || []}
            />
            <ChartCard
              title="Top Species"
              description="Current stock quantities per species"
              type="bar"
              data={stats?.species_distribution || []}
            />
            <ChartCard
              title="Status Overview"
              description="Batch statuses across region"
              type="horizontal-bar"
              data={stats?.status_distribution || []}
            />
          </div>

          {/* Search Bar - Shop Style */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 bg-pale rounded-sm px-5 py-3">
                <div className="relative flex-1 flex items-center gap-3">
                  <Search size={14} className="text-[var(--very-dark-color)]/50" />
                  <Input
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 bg-transparent focus:ring-0 text-base h-8"
                  />
                </div>
                <button
                  className="hover:opacity-100 opacity-50"
                  onClick={() => setShowFilters(true)}
                >
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Sidebar - Shop Style */}
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setShowFilters(false)}
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed right-0 top-0 h-full min-w-[30vw] bg-[var(--card)] shadow-lg z-60 p-8 flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                    <h3 className="text-base">Filters</h3>
                    <Button variant="pale" size="icon-sm" onClick={() => setShowFilters(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                      <h4 className="text-base font-medium mb-3">Status</h4>
                      <div className="space-y-2">
                        {uniqueStatuses.filter(Boolean).map((status) => (
                          <label key={status} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                value={status}
                                checked={tempStatuses.includes(status)}
                                onChange={(e) => {
                                  if (e.target.checked && status) {
                                    setTempStatuses(prev => [...prev, status]);
                                  } else {
                                    setTempStatuses(prev => prev.filter(s => s !== status));
                                  }
                                }}
                              />
                              <div className={`w-5 h-5 border-2 rounded transition-colors ${tempStatuses.includes(status)
                                ? 'bg-primary border-primary'
                                : 'border-[var(--border)] bg-[var(--card)]'
                                }`}>
                                {tempStatuses.includes(status) && status && (
                                  <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                )}
                              </div>
                            </div>
                            <span className="text-base capitalize">{status.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-medium mb-3">Region</h4>
                      <div className="space-y-2">
                        {uniqueRegions.filter(Boolean).map((region) => (
                          <label key={region} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                value={region}
                                checked={tempRegions.includes(region)}
                                onChange={(e) => {
                                  if (e.target.checked && region) {
                                    setTempRegions(prev => [...prev, region]);
                                  } else {
                                    setTempRegions(prev => prev.filter(r => r !== region));
                                  }
                                }}
                              />
                              <div className={`w-5 h-5 border-2 rounded transition-colors ${tempRegions.includes(region)
                                ? 'bg-primary border-primary'
                                : 'border-[var(--border)] bg-[var(--card)]'
                                }`}>
                                {tempRegions.includes(region) && region && (
                                  <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                )}
                              </div>
                            </div>
                            <span className="text-base">{region}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-medium mb-3">Species</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {uniqueSpecies.filter(Boolean).map((species) => (
                          <label key={species} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--pale)] p-2 rounded-md transition-colors">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                value={species}
                                checked={tempSpecies.includes(species)}
                                onChange={(e) => {
                                  if (e.target.checked && species) {
                                    setTempSpecies(prev => [...prev, species]);
                                  } else {
                                    setTempSpecies(prev => prev.filter(s => s !== species));
                                  }
                                }}
                              />
                              <div className={`w-5 h-5 border-2 rounded transition-colors ${tempSpecies.includes(species)
                                ? 'bg-primary border-primary'
                                : 'border-[var(--border)] bg-[var(--card)]'
                                }`}>
                                {tempSpecies.includes(species) && species && (
                                  <Check size={14} className="text-white absolute top-0.5 left-0.5" />
                                )}
                              </div>
                            </div>
                            <span className="text-base">{species}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-medium mb-3">Sort By</h4>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 border border-[var(--border)] rounded-md bg-[var(--card)]"
                      >
                        <option value="received_date">Received Date</option>
                        <option value="batch_number">Batch Number</option>
                        <option value="current_quantity">Quantity</option>
                        <option value="species_name">Species</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 border-t border-[var(--border)]">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear</Button>
                      <Button
                        className="flex-1 bg-primary"
                        onClick={applyFilters}
                        disabled={filtersLoading}
                      >
                        {filtersLoading ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Inventory Table */}
          <DataTable
            data={rows}
            columns={columns}
            title="Regional Inventory Batches"
            description={loading ? "Loading..." : `Showing ${rows.length} of ${batches.length} inventory batches across all nurseries in your region`}
            searchable={false} // Search handled by filters above
            emptyMessage={loading ? "Loading inventory..." : "No inventory batches found matching your criteria"}
            actions={(item) => (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="pale" title="View Details">
                  <Package size={14} />
                </Button>
              </div>
            )}
          />

          {/* Pending Inventory Requests */}
          {inventoryRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  Pending Inventory Requests
                </CardTitle>
                <CardDescription>
                  Inventory transfer requests awaiting your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <div>
                          <p className="font-medium">Request #{request.id}</p>
                          <p className="text-sm text-muted-foreground">
                            Transfer Request - Status: {request.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">Approve</Button>
                        <Button size="sm" variant="pale">Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

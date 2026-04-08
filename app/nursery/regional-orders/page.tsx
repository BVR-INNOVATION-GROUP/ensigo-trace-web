"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DataTable, Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { type UserRole } from "@/src/models/User";
import { ShoppingCart, Clock, CheckCircle, XCircle, Package, Eye, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency";
import api, { type Sale, type Nursery, type User } from "@/src/api/client";

type OrderStatus = "pending" | "approved" | "declined" | "fulfilled";

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes: string) => void;
  loading: boolean;
}

interface DeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecline: (reason: string) => void;
  loading: boolean;
}

function ApproveModal({ isOpen, onClose, onApprove, loading }: ApproveModalProps) {
  const [notes, setNotes] = useState("");

  const handleApprove = () => {
    onApprove(notes);
    setNotes("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Order" size="md">
      <div className="p-6 space-y-4">
        <div>
          <label className="text-label block mb-2">Approval Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this approval..."
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="pale" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApprove} disabled={loading}>
            {loading ? "Approving..." : "Approve Order"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeclineModal({ isOpen, onClose, onDecline, loading }: DeclineModalProps) {
  const [reason, setReason] = useState("");

  const handleDecline = () => {
    if (!reason.trim()) {
      return;
    }
    onDecline(reason);
    setReason("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decline Order" size="md">
      <div className="p-6 space-y-4">
        <div>
          <label className="text-label block mb-2">Decline Reason *</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for declining this order..."
            rows={3}
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="pale" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDecline}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Declining..." : "Decline Order"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function RegionalOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myNursery, setMyNursery] = useState<Nursery | null>(null);
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const loadOrders = useCallback(async () => {
    if (!user || !myNursery) return;

    try {
      setLoading(true);
      const result = await api.getOnlineOrders({
        nursery_id: myNursery.id,
        limit: 20,
        offset: 0,
      });
      setOrders(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user, myNursery]);

  const loadContext = useCallback(async () => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const current = JSON.parse(raw) as User & { nursery_id?: string; business_name?: string };
    setUser(current);
    if (current.role !== "regional_nursery" && current.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    const nursery = await resolveMyNursery(current);
    setMyNursery(nursery);
  }, [resolveMyNursery, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContext().catch((error) => console.error("Failed to load context:", error));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadContext]);

  useEffect(() => {
    if (user && myNursery) {
      void loadOrders();
    }
  }, [user, myNursery, loadOrders]);

  // Chart data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      counts[order.order_status || "unknown"] = (counts[order.order_status || "unknown"] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [orders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-blue-500/10 text-blue-600",
      declined: "bg-red-500/10 text-red-600",
      fulfilled: "bg-green-500/10 text-green-600",
    };
    return colors[status] || "bg-card text-foreground";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "approved":
        return <CheckCircle size={16} />;
      case "declined":
        return <XCircle size={16} />;
      case "fulfilled":
        return <Package size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const handleApprove = async (notes: string) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      await api.approveOrder(selectedOrder.id, { notes });
      await loadOrders();
      setApproveModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error approving order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (reason: string) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      await api.declineOrder(selectedOrder.id, { reason });
      await loadOrders();
      setDeclineModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error declining order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async (order: Sale) => {
    try {
      setActionLoading(true);
      await api.fulfillOrder(order.id);
      await loadOrders();
    } catch (error) {
      console.error("Error fulfilling order:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = orders.filter(o => o.order_status === "pending").length;
  const approvedCount = orders.filter(o => o.order_status === "approved").length;
  const declinedCount = orders.filter(o => o.order_status === "declined").length;
  const fulfilledCount = orders.filter(o => o.order_status === "fulfilled").length;

  const columns: Column<Sale>[] = [
    {
      key: "saleNumber",
      header: "Order #",
      render: (item) => <span className="font-mono text-primary">{item.saleNumber}</span>,
    },
    { key: "customerName", header: "Customer" },
    { key: "species", header: "Species", render: (item) => item.species?.scientific_name || "Unknown" },
    {
      key: "quantity",
      header: "Qty",
      render: (item) => `${item.quantity} ${item.unit}`,
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (item) => formatCurrency(item.totalAmount, 'UGX'),
    },
    {
      key: "orderStatus",
      header: "Status",
      render: (item) => (
        <Badge className={getStatusColor(item.orderStatus || "unknown")}>
          <div className="flex items-center gap-1">
            {getStatusIcon(item.orderStatus || "unknown")}
            <span>{item.orderStatus || "unknown"}</span>
          </div>
        </Badge>
      ),
    },
    {
      key: "saleDate",
      header: "Date",
      render: (item) => new Date(item.saleDate).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="pale" title="View Details">
            <Eye size={14} />
          </Button>
          {item.orderStatus === "pending" && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setSelectedOrder(item);
                  setApproveModalOpen(true);
                }}
                title="Approve Order"
              >
                <CheckCircle size={14} />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setSelectedOrder(item);
                  setDeclineModalOpen(true);
                }}
                title="Decline Order"
              >
                <XCircle size={14} />
              </Button>
            </>
          )}
          {item.orderStatus === "approved" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleFulfill(item)}
              title="Mark as Fulfilled"
              disabled={actionLoading}
            >
              <Package size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["regional_nursery", "admin"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["regional_nursery", "admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-h4 mb-1">Online Order Management</h1>
            <p className="text-caption text-[var(--very-dark-color)]/60">
              Review and manage online orders from the shop
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Orders" value={orders.length} icon={<ShoppingCart size={20} />} index={0} />
            <SummaryCard title="Pending" value={pendingCount} icon={<Clock size={20} />} index={1} />
            <SummaryCard title="Approved" value={approvedCount} icon={<CheckCircle size={20} />} index={2} />
            <SummaryCard title="Fulfilled" value={fulfilledCount} icon={<Package size={20} />} index={3} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Order Status"
              description="Distribution by order status"
              type="donut"
              data={statusChartData}
            />
            <div className="bg-card rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-h6 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Pending Orders: {pendingCount}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Approved Orders: {approvedCount}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Declined Orders: {declinedCount}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Fulfilled Orders: {fulfilledCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            data={orders}
            columns={columns}
            title="All Online Orders"
            description={`Showing ${orders.length} of ${total} orders`}
            searchable
            searchPlaceholder="Search orders..."
            searchKeys={["sale_number", "customer_name", "species", "sale_date"] as (keyof Sale)[]}
            emptyMessage="No online orders yet"
          />

          {/* Modals */}
          <ApproveModal
            isOpen={approveModalOpen}
            onClose={() => {
              setApproveModalOpen(false);
              setSelectedOrder(null);
            }}
            onApprove={handleApprove}
            loading={actionLoading}
          />

          <DeclineModal
            isOpen={declineModalOpen}
            onClose={() => {
              setDeclineModalOpen(false);
              setSelectedOrder(null);
            }}
            onDecline={handleDecline}
            loading={actionLoading}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

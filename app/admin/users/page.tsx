 "use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ProtectedRoute } from "@/components/auth/protected-route";
import api, { type User } from "@/src/api/client";
import { CheckCircle2, UserX2, RefreshCw } from "lucide-react";

type FilterTab = "pending-regional" | "all";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending-regional");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAllUsers({});
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filter === "pending-regional") {
      return users.filter(
        (u) => u.role === "regional_nursery" && !u.is_verified
      );
    }
    return users;
  }, [users, filter]);

  const handleApprove = async (user: User) => {
    setSavingId(user.id);
    try {
      const updated = await api.approveUser(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      console.error("Failed to approve user", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve user. Please try again."
      );
    } finally {
      setSavingId(null);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-medium">{user.name}</span>
          <span className="text-caption text-[var(--very-dark-color)]/60">
            {user.email}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge className="bg-pale text-[var(--very-dark-color)] border border-[var(--very-dark-color)]/10">
          {user.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "business_name",
      header: "Organisation",
      render: (user) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-body-sm font-medium">
            {user.business_name || "—"}
          </span>
          <span className="text-caption text-[var(--very-dark-color)]/60">
            {user.region || "No region"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Badge
            className={
              user.is_verified
                ? "bg-green-500/10 text-green-600"
                : "bg-yellow-500/10 text-yellow-700"
            }
          >
            {user.is_verified ? "Verified" : "Pending"}
          </Badge>
          {!user.is_active && (
            <Badge className="bg-red-500/10 text-red-600">Inactive</Badge>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (user) => (
        <span className="text-caption text-[var(--very-dark-color)]/60">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-h4 mb-1">User approvals</h1>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Super admin view of all accounts, with a focus on pending
                regional nurseries.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="pale"
                size="sm"
                onClick={() => void loadUsers()}
                disabled={loading}
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="text-caption">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg bg-pale p-1 text-caption">
            <button
              type="button"
              onClick={() => setFilter("pending-regional")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === "pending-regional"
                  ? "bg-paper text-[var(--very-dark-color)] shadow-custom"
                  : "text-[var(--very-dark-color)]/70"
              }`}
            >
              Pending regional nurseries
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === "all"
                  ? "bg-paper text-[var(--very-dark-color)] shadow-custom"
                  : "text-[var(--very-dark-color)]/70"
              }`}
            >
              All users
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3 text-body-sm text-red-700">
              {error}
            </div>
          )}

          <DataTable<User>
            data={filteredUsers}
            columns={columns}
            title={
              filter === "pending-regional"
                ? "Pending regional nursery accounts"
                : "All users"
            }
            description={
              filter === "pending-regional"
                ? "Review and approve new regional nursery admins before they can manage nurseries and collectors."
                : "Full list of EnsigoTrace users."
            }
            searchable
            searchPlaceholder="Search by name, email, or organisation"
            searchKeys={["name", "email", "business_name", "region"]}
            emptyMessage={
              filter === "pending-regional"
                ? "No pending regional nursery accounts."
                : "No users found."
            }
            actions={(user) =>
              !user.is_verified ? (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="pale"
                    onClick={() => void handleApprove(user)}
                    disabled={savingId === user.id}
                  >
                    <CheckCircle2 size={14} />
                    <span className="text-caption">
                      {savingId === user.id ? "Approving..." : "Approve"}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 text-caption text-[var(--very-dark-color)]/50">
                  <UserX2 size={14} />
                  <span>Verified</span>
                </div>
              )
            }
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


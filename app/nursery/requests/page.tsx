"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, Clock3, Package, XCircle } from "lucide-react";
import { NURSERY_ROLES, type UserRole } from "@/src/models/User";
import api, { CreateInventoryRequest, InventoryRequest, Nursery, Species, User } from "@/src/api/client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function InventoryRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [myNursery, setMyNursery] = useState<Nursery | null>(null);
  const [sourceNursery, setSourceNursery] = useState<Nursery | null>(null);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [form, setForm] = useState<{ species_id: string; quantity: string; unit: "count" | "kg" | "g"; notes: string }>({
    species_id: "",
    quantity: "",
    unit: "count",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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
      rows.find(
        (n) => n.region && currentUser.region && n.region.toLowerCase() === currentUser.region.toLowerCase()
      ) ||
      (rows.length === 1 ? rows[0] : null)
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return;
      const currentUser = JSON.parse(rawUser) as User & { nursery_id?: string; business_name?: string };
      setUser(currentUser);

      const [nursery, speciesRes] = await Promise.all([
        resolveMyNursery(currentUser),
        api.getSpecies({ limit: 300, offset: 0 }),
      ]);
      setMyNursery(nursery);
      setSpecies(speciesRes.data);
      if (!nursery) {
        setRequests([]);
        setSourceNursery(null);
        return;
      }

      if (currentUser.role === "community_nursery" && nursery.parent_nursery_id) {
        setSourceNursery(await api.getNursery(nursery.parent_nursery_id));
      } else if (currentUser.role === "super_nursery" && nursery.regional_nursery_id) {
        setSourceNursery(await api.getNursery(nursery.regional_nursery_id));
      } else {
        setSourceNursery(null);
      }

      const list = await api.getInventoryRequests({ nursery_id: nursery.id, limit: 500, offset: 0 });
      setRequests(list.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading inventory requests");
    } finally {
      setLoading(false);
    }
  }, [resolveMyNursery]);

  useEffect(() => {
    load();
  }, [load]);

  const canCreateRequest = user?.role === "community_nursery" || user?.role === "super_nursery" || user?.role === "admin";

  const createRequest = useCallback(async (): Promise<boolean> => {
    if (!myNursery || !sourceNursery || !form.species_id || !form.quantity) return false;
    setSaving(true);
    setError(null);
    try {
      const payload: CreateInventoryRequest = {
        from_nursery_id: sourceNursery.id,
        to_nursery_id: myNursery.id,
        species_id: form.species_id,
        quantity: Number(form.quantity),
        unit: form.unit,
        notes: form.notes || undefined,
      };
      await api.createInventoryRequest(payload);
      setForm({ species_id: "", quantity: "", unit: "count", notes: "" });
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed creating request");
      return false;
    } finally {
      setSaving(false);
    }
  }, [myNursery, sourceNursery, form, load]);

  const runAction = useCallback(
    async (id: string, action: "approve" | "reject" | "fulfill" | "approve_fulfill") => {
      setSaving(true);
      setError(null);
      try {
        if (action === "approve") await api.approveInventoryRequest(id);
        if (action === "approve_fulfill") {
          await api.approveInventoryRequest(id);
          await api.fulfillInventoryRequest(id);
        }
        if (action === "reject") await api.rejectInventoryRequest(id);
        if (action === "fulfill") await api.fulfillInventoryRequest(id);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : `Failed to ${action.replace("_", " ")} request`);
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const columns = useMemo<Column<InventoryRequest>[]>(
    () => [
      { key: "status", header: "Status" },
      { key: "from", header: "From", render: (row) => row.from_nursery?.name || "-" },
      { key: "to", header: "To", render: (row) => row.to_nursery?.name || "-" },
      { key: "species", header: "Species", render: (row) => row.species?.scientific_name || "-" },
      { key: "quantity", header: "Quantity", render: (row) => `${row.quantity} ${row.unit}` },
      { key: "created_at", header: "Requested", render: (row) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : "-") },
    ],
    []
  );

  const requestSubtitle = useMemo(() => {
    if (user?.role === "community_nursery") return "Community requests from linked super nursery.";
    if (user?.role === "super_nursery") return "Super nursery requests from linked regional and serves linked communities.";
    if (user?.role === "regional_nursery") return "Regional nursery reviews and fulfills incoming super nursery requests.";
    return "Inventory request flow";
  }, [user?.role]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === "pending").length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "approved").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "rejected").length, [requests]);
  const totalRequested = useMemo(() => requests.reduce((sum, r) => sum + (r.quantity || 0), 0), [requests]);

  const monthlyRequestData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; requested: number; approved: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { month: "short" });
      months.push({ key, label, requested: 0, approved: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));

    for (const r of requests) {
      if (r.created_at) {
        const created = new Date(r.created_at);
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        const row = byKey.get(key);
        if (row) row.requested += 1;
      }
      if (r.status === "approved" || r.status === "fulfilled") {
        const approvedAt = r.reviewed_at ? new Date(r.reviewed_at) : r.created_at ? new Date(r.created_at) : null;
        if (approvedAt) {
          const key = `${approvedAt.getFullYear()}-${String(approvedAt.getMonth() + 1).padStart(2, "0")}`;
          const row = byKey.get(key);
          if (row) row.approved += 1;
        }
      }
    }
    return months.map(({ label, requested, approved }) => ({ label, requested, approved }));
  }, [requests]);

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Inventory Requests</h1>
              <p className="text-caption opacity-70">{requestSubtitle}</p>
            </div>
            {canCreateRequest && (
              <Button
                variant="default"
                disabled={!sourceNursery || !myNursery}
                onClick={() => setIsRequestModalOpen(true)}
              >
                New Request
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <SummaryCard title="Total Requests" value={requests.length} icon={<Package size={20} />} />
            <SummaryCard title="Pending" value={pendingCount} icon={<Clock3 size={20} />} />
            <SummaryCard title="Approved" value={approvedCount} icon={<CheckCircle2 size={20} />} />
            <SummaryCard title="Rejected" value={rejectedCount} icon={<XCircle size={20} />} />
            <SummaryCard title="Total Quantity" value={totalRequested} icon={<Package size={20} />} />
          </div>

          <div className="bg-paper rounded-lg shadow-custom p-6">
            <div className="mb-4">
              <h3 className="text-h5">Requests Trend (Last 8 Months)</h3>
              <p className="text-caption text-[var(--very-dark-color)]/60">
                Monthly requests made vs approved (2 bars per month).
              </p>
            </div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRequestData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--very-dark-color)" strokeOpacity={0.1} />
                  <XAxis dataKey="label" tick={{ fill: "var(--very-dark-color)", opacity: 0.65, fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--very-dark-color)", opacity: 0.65, fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "var(--paper)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                    }}
                    labelStyle={{ color: "var(--very-dark-color)" }}
                    itemStyle={{ color: "var(--very-dark-color)" }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    formatter={(value) => (
                      <span style={{ color: "var(--very-dark-color)", fontSize: 12 }}>
                        {value === "requested" ? "Requested" : "Approved"}
                      </span>
                    )}
                  />
                  <Bar dataKey="requested" name="Requested" fill="var(--chart-blue)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <DataTable
            data={requests}
            columns={columns}
            title={myNursery ? `${myNursery.name} Requests` : "Requests"}
            description={loading ? "Loading..." : "Track approvals and fulfillment across nursery tiers"}
            searchable
            searchPlaceholder="Search requests..."
            searchKeys={["status"]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-1">
                {row.status === "pending" && (
                  <>
                    <Button size="sm" variant="pale" disabled={saving} onClick={() => runAction(row.id, "approve_fulfill")}>
                      Approve & Transfer
                    </Button>
                    <Button size="sm" variant="pale" disabled={saving} onClick={() => runAction(row.id, "reject")}>Reject</Button>
                  </>
                )}
                {row.status === "approved" && (
                  <Button size="sm" variant="pale" disabled={saving} onClick={() => runAction(row.id, "fulfill")}>Fulfill</Button>
                )}
              </div>
            )}
            emptyMessage={loading ? "Loading requests..." : "No inventory requests yet"}
          />

          {canCreateRequest && sourceNursery && myNursery && (
            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="New Inventory Request" size="lg">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Nursery</label>
                    <Input value={sourceNursery.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Nursery</label>
                    <Input value={myNursery.name} disabled />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Species</label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-background px-3"
                      value={form.species_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, species_id: e.target.value }))}
                    >
                      <option value="">Select species</option>
                      {species.map((s) => (
                        <option key={s.id} value={s.id}>{s.scientific_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Quantity"
                      value={form.quantity}
                      onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      className="h-10 w-full rounded-md border border-[var(--border)] bg-background px-3"
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value as "count" | "kg" | "g" }))}
                    >
                      <option value="count">count</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      placeholder="Optional notes"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="pale" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      const ok = await createRequest();
                      if (ok) setIsRequestModalOpen(false);
                    }}
                    disabled={!form.species_id || !form.quantity}
                    loading={saving}
                  >
                    Request Stock
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

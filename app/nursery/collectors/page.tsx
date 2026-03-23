"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, Eye, EyeOff, Sparkles, UserCheck, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { Nursery, NurseryCollector, User, type CreateCollectorForNurseryRequest } from "@/src/api/client";

type CollectorRow = NurseryCollector & {
  collector_name: string;
  collector_email: string;
  collector_phone: string;
  collector_region: string;
  collector_address: string;
  account_state: string;
  verification_state: string;
  joined_label: string;
};

type CreateCollectorForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function RegionalCollectorsPage() {
  const router = useRouter();
  const [regionalNursery, setRegionalNursery] = useState<Nursery | null>(null);
  const [collectors, setCollectors] = useState<NurseryCollector[]>([]);
  const [form, setForm] = useState<CreateCollectorForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const length = 12;
    let result = "";
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((prev) => ({ ...prev, password: result }));
    setShowPassword(true);
  }, []);

  const resolveRegionalNursery = useCallback(async (): Promise<Nursery | null> => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    const user = JSON.parse(rawUser) as User & { nursery_id?: string; business_name?: string };
    const response = await api.getNurseries({ type: "regional", limit: 200, offset: 0 });
    const regionalNurseries = response.data || [];

    // Primary: operator ownership
    const byOperator = regionalNurseries.find((n) => n.operator_id === user.id);
    if (byOperator) return byOperator;

    // Fallback: some sessions include direct nursery identifiers.
    const bySessionNurseryId = regionalNurseries.find(
      (n) => n.id === user.nursery_id || n.nursery_id === user.nursery_id
    );
    if (bySessionNurseryId) return bySessionNurseryId;

    // Additional fallback for accounts without nursery_id in session.
    const byContactOrName = regionalNurseries.find(
      (n) =>
        (n.contact_email && user.email && n.contact_email.toLowerCase() === user.email.toLowerCase()) ||
        (n.name && user.business_name && n.name.toLowerCase() === user.business_name.toLowerCase())
    );
    if (byContactOrName) return byContactOrName;

    const byRegion = regionalNurseries.find(
      (n) => n.region && user.region && n.region.toLowerCase() === user.region.toLowerCase()
    );
    if (byRegion) return byRegion;

    // Last fallback: if only one regional nursery exists, use it.
    if (regionalNurseries.length === 1) return regionalNurseries[0];

    return null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const regional = await resolveRegionalNursery();
      setRegionalNursery(regional);
      if (regional) {
        const rows = await api.getNurseryCollectors(regional.id);
        setCollectors(rows);
      } else {
        setCollectors([]);
        setError("No regional nursery context found for your account.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading collectors");
    } finally {
      setLoading(false);
    }
  }, [resolveRegionalNursery]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddCollector = useCallback(async (): Promise<boolean> => {
    if (!regionalNursery || !form.name.trim() || !form.email.trim() || !form.password.trim()) return false;
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateCollectorForNurseryRequest = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      await api.createCollectorForNursery(regionalNursery.id, payload);
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
      });
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed adding collector");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [regionalNursery, form, load]);

  const handleRemoveCollector = useCallback(
    async (collectorId: string) => {
      if (!regionalNursery) return;
      setSubmitting(true);
      setError(null);
      try {
        await api.removeCollectorFromNursery(regionalNursery.id, collectorId);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed removing collector");
      } finally {
        setSubmitting(false);
      }
    },
    [regionalNursery, load]
  );

  const collectorRows = useMemo<CollectorRow[]>(
    () =>
      collectors.map((row) => ({
        ...row,
        collector_name: row.collector?.name || "-",
        collector_email: row.collector?.email || "-",
        collector_phone: row.collector?.phone || "-",
        collector_region: row.collector?.region || "-",
        collector_address: row.collector?.address || "-",
        account_state: row.collector?.is_active ? "Active" : "Inactive",
        verification_state: row.collector?.is_verified ? "Verified" : "Pending",
        joined_label: formatDate(row.joined_at),
      })),
    [collectors]
  );

  const columns = useMemo<Column<CollectorRow>[]>(
    () => [
      { key: "collector_name", header: "Collector" },
      { key: "collector_email", header: "Email" },
      { key: "collector_phone", header: "Phone" },
      { key: "collector_region", header: "Region" },
      { key: "collector_address", header: "Address" },
      { key: "account_state", header: "Account" },
      { key: "verification_state", header: "Verified" },
      { key: "joined_label", header: "Joined" },
      { key: "status", header: "Status", render: (row) => row.status || "-" },
    ],
    []
  );

  const activeCollectors = useMemo(
    () => collectorRows.filter((c) => c.account_state === "Active").length,
    [collectorRows]
  );
  const verifiedCollectors = useMemo(
    () => collectorRows.filter((c) => c.verification_state === "Verified").length,
    [collectorRows]
  );
  const pendingVerification = collectorRows.length - verifiedCollectors;
  const inactiveCollectors = collectorRows.length - activeCollectors;

  const statusChartData = useMemo(
    () => [
      { label: "Verified", value: verifiedCollectors },
      { label: "Pending", value: pendingVerification },
      { label: "Inactive", value: inactiveCollectors },
    ],
    [inactiveCollectors, pendingVerification, verifiedCollectors]
  );

  const canSubmitCreate = useMemo(
    () => !!regionalNursery && !!form.name.trim() && !!form.email.trim() && !!form.password.trim(),
    [regionalNursery, form.email, form.name, form.password]
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Collectors Management</h1>
              <p className="text-caption opacity-70">
                Regional nursery manages collector accounts used for collection submissions.
              </p>
            </div>
            <Button
              variant="default"
              disabled={!regionalNursery}
              onClick={() => {
                setError(null);
                setShowPassword(false);
                setIsAddModalOpen(true);
              }}
            >
              Add Collector
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Total Collectors" value={collectorRows.length} icon={<Users size={20} />} />
            <SummaryCard title="Active Accounts" value={activeCollectors} icon={<UserCheck size={20} />} />
            <SummaryCard title="Verified" value={verifiedCollectors} icon={<CheckCircle2 size={20} />} />
            <SummaryCard title="Needs Verification" value={pendingVerification} icon={<XCircle size={20} />} />
          </div>

          <ChartCard
            title="Collector Account Status"
            description="Verification and activity distribution for assigned collectors."
            type="donut"
            data={statusChartData}
            height={260}
          />

          <DataTable
            data={collectorRows}
            columns={columns}
            title={regionalNursery ? `${regionalNursery.name} Collectors` : "Collectors"}
            description={loading ? "Loading..." : "Assigned collectors for this regional nursery"}
            searchable
            searchPlaceholder="Search collectors..."
            searchKeys={[
              "collector_name",
              "collector_email",
              "collector_phone",
              "collector_region",
              "collector_address",
              "account_state",
              "verification_state",
              "status",
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="pale"
                  onClick={() => row.collector_id && router.push(`/nursery/collectors/${row.collector_id}`)}
                >
                  View Collections
                </Button>
                <Button
                  size="sm"
                  variant="pale"
                  disabled={submitting}
                  onClick={() => row.collector_id && handleRemoveCollector(row.collector_id)}
                >
                  Remove
                </Button>
              </div>
            )}
            emptyMessage={loading ? "Loading collectors..." : "No collectors assigned"}
          />

          <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Collector" size="lg">
            <div className="p-6 space-y-4">
              <p className="text-caption text-[var(--very-dark-color)]/70">Create a new collector user account and assign it to this regional nursery.</p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input placeholder="Collector name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="collector@email.com" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Set password"
                      value={form.password}
                      className="pr-16"
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--very-dark-color)]/60 hover:text-[var(--very-dark-color)]"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <button
                      type="button"
                      aria-label="Generate password"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--very-dark-color)]/60 hover:text-[var(--very-dark-color)]"
                      onClick={generatePassword}
                    >
                      <Sparkles size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input placeholder="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="pale" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const ok = await handleAddCollector();
                    if (ok) setIsAddModalOpen(false);
                  }}
                  loading={submitting}
                  disabled={!canSubmitCreate}
                >
                  Add Collector
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

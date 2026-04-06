"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Building2, Package, Sprout, Warehouse, Eye, EyeOff, RefreshCw } from "lucide-react";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { CreateNurseryRequest, Nursery, User } from "@/src/api/client";

export default function SuperNurseriesPage() {
  const [regionalNursery, setRegionalNursery] = useState<Nursery | null>(null);
  const [superNurseries, setSuperNurseries] = useState<Nursery[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("10000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formRegion, setFormRegion] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formLocation, setFormLocation] = useState("");

  // Credentials for the super nursery operator user account.
  const [operatorName, setOperatorName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorPassword, setOperatorPassword] = useState("");
  const [operatorPhone, setOperatorPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return;
      const user = JSON.parse(rawUser) as User & { nursery_id?: string; business_name?: string };
      const [regionals, supers] = await Promise.all([
        api.getNurseries({ type: "regional", limit: 200, offset: 0 }),
        api.getNurseries({ type: "super", limit: 500, offset: 0 }),
      ]);
      const regionalNurseries = regionals.data || [];
      const currentRegional =
        regionalNurseries.find((n) => n.operator_id === user.id) ||
        regionalNurseries.find((n) => n.id === user.nursery_id || n.nursery_id === user.nursery_id) ||
        regionalNurseries.find(
          (n) =>
            (n.contact_email && user.email && n.contact_email.toLowerCase() === user.email.toLowerCase()) ||
            (n.name && user.business_name && n.name.toLowerCase() === user.business_name.toLowerCase())
        ) ||
        regionalNurseries.find(
          (n) => n.region && user.region && n.region.toLowerCase() === user.region.toLowerCase()
        ) ||
        (regionalNurseries.length === 1 ? regionalNurseries[0] : null);
      setRegionalNursery(currentRegional);
      if (!currentRegional) {
        setSuperNurseries([]);
        setError("No regional nursery context found for your account.");
        return;
      }
      setFormRegion(currentRegional.region || "");
      setFormDistrict(currentRegional.district || "");
      setFormLocation(currentRegional.location || "");
      setSuperNurseries(supers.data.filter((n) => n.regional_nursery_id === currentRegional.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading super nurseries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generatePassword = useCallback(() => {
    setGeneratingPassword(true);
    // Generate a secure random password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOperatorPassword(password);
    setTimeout(() => setGeneratingPassword(false), 500);
  }, []);
  const createSuperNursery = useCallback(async () => {
    if (!regionalNursery || !name.trim()) return;
    if (!operatorName.trim() || !operatorEmail.trim() || !operatorPassword.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CreateNurseryRequest = {
        name: name.trim(),
        type: "super",
        region: formRegion || regionalNursery.region,
        district: formDistrict || regionalNursery.district,
        location: formLocation || regionalNursery.location,
        capacity: Number(capacity) || 10000,
        regional_nursery_id: regionalNursery.id,

        // Nursery contact is aligned with the operator account so it can be found easily.
        contact_email: operatorEmail.trim(),
        contact_phone: operatorPhone.trim() || undefined,

        // Provision the dedicated login user that will manage this super nursery.
        super_operator_name: operatorName.trim(),
        super_operator_email: operatorEmail.trim(),
        super_operator_password: operatorPassword,
        super_operator_phone: operatorPhone.trim() || undefined,
      };
      await api.createNursery(payload);
      setName("");
      setOperatorName("");
      setOperatorEmail("");
      setOperatorPassword("");
      setOperatorPhone("");
      setIsCreateModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed creating super nursery");
    } finally {
      setSaving(false);
    }
  }, [
    regionalNursery,
    name,
    capacity,
    formRegion,
    formDistrict,
    formLocation,
    operatorName,
    operatorEmail,
    operatorPassword,
    operatorPhone,
    load,
  ]);

  const columns = useMemo<Column<Nursery>[]>(
    () => [
      { key: "nursery_id", header: "Code" },
      { key: "name", header: "Name" },
      { key: "region", header: "Region" },
      { key: "capacity", header: "Capacity", render: (row) => row.capacity?.toLocaleString() || "0" },
      { key: "current_stock", header: "Current Stock", render: (row) => row.current_stock?.toLocaleString() || "0" },
    ],
    []
  );

  const totalCapacity = useMemo(
    () => superNurseries.reduce((sum, n) => sum + (n.capacity || 0), 0),
    [superNurseries]
  );
  const totalStock = useMemo(
    () => superNurseries.reduce((sum, n) => sum + (n.current_stock || 0), 0),
    [superNurseries]
  );
  const linkedCommunities = useMemo(
    () => superNurseries.reduce((sum, n) => sum + (n.child_nurseries?.length || 0), 0),
    [superNurseries]
  );
  const stockBySuperData = useMemo(
    () =>
      superNurseries
        .slice()
        .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
        .slice(0, 8)
        .map((n) => ({ label: n.name, value: n.current_stock || 0 })),
    [superNurseries]
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Super Nurseries Management</h1>
              <p className="text-caption opacity-70">
                Regional nursery controls super nurseries; each super nursery manages community nurseries.
              </p>
            </div>
            <Button variant="default" disabled={!regionalNursery} onClick={() => setIsCreateModalOpen(true)}>
              Add Super Nursery
            </Button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Super Nurseries" value={superNurseries.length} icon={<Building2 size={20} />} />
            <SummaryCard title="Total Capacity" value={totalCapacity} icon={<Warehouse size={20} />} />
            <SummaryCard title="Current Stock" value={totalStock} icon={<Package size={20} />} />
            <SummaryCard title="Linked Communities" value={linkedCommunities} icon={<Sprout size={20} />} />
          </div>

          <ChartCard
            title="Current Stock by Super Nursery"
            description="Top super nurseries ranked by available stock."
            type="bar"
            data={stockBySuperData.length > 0 ? stockBySuperData : [{ label: "No data", value: 0 }]}
            height={300}
          />

          <DataTable
            data={superNurseries}
            columns={columns}
            title={regionalNursery ? `Super Nurseries under ${regionalNursery.name}` : "Super Nurseries"}
            description={loading ? "Loading..." : "Manage linked super nurseries"}
            searchable
            searchPlaceholder="Search super nurseries..."
            searchKeys={["name", "nursery_id"]}
            actions={(row) => (
              <Link href={`/nursery/super-nurseries/${row.id}`}>
                <Button size="sm" variant="pale">Manage Communities</Button>
              </Link>
            )}
            emptyMessage={loading ? "Loading super nurseries..." : "No super nurseries linked yet"}
          />

          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Super Nursery" size="xl">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="Super nursery name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity</label>
                    <Input type="number" min={1} placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Region</label>
                    <Input placeholder="Region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">District</label>
                    <Input placeholder="District" value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input placeholder="Location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Super Nursery Operator Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Create the user account that can log in and manage this super nursery.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operator Name</label>
                      <Input placeholder="Operator full name" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operator Email</label>
                      <Input
                        type="email"
                        placeholder="operator@email.com"
                        value={operatorEmail}
                        onChange={(e) => setOperatorEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operator Phone (optional)</label>
                      <Input placeholder="+xxx..." value={operatorPhone} onChange={(e) => setOperatorPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Operator Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Temporary password"
                        value={operatorPassword}
                        onChange={(e) => setOperatorPassword(e.target.value)}
                        className="pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-8 w-8 p-0"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generatePassword}
                          disabled={generatingPassword}
                          className="h-8 w-8 p-0"
                          title="Generate secure password"
                        >
                          <RefreshCw size={16} className={generatingPassword ? "animate-spin" : ""} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Click the refresh icon to generate a secure password</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="pale" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button
                  onClick={createSuperNursery}
                  disabled={!regionalNursery || !name.trim() || !operatorName.trim() || !operatorEmail.trim() || !operatorPassword.trim()}
                  loading={saving}
                >
                  Add Super Nursery
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

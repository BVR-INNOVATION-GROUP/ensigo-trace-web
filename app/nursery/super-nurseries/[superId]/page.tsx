"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Building2, Package, Store, Warehouse, Eye, EyeOff, RefreshCw } from "lucide-react";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { CreateNurseryRequest, Nursery } from "@/src/api/client";

export default function SuperNurseryCommunityPage() {
  const params = useParams<{ superId: string }>();
  const superId = params.superId;

  const [superNursery, setSuperNursery] = useState<Nursery | null>(null);
  const [communities, setCommunities] = useState<Nursery[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formRegion, setFormRegion] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formLocation, setFormLocation] = useState("");

  // Credentials for the community nursery operator user account.
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
      const [superData, allCommunities] = await Promise.all([
        api.getNursery(superId),
        api.getNurseries({ type: "community", limit: 1000, offset: 0 }),
      ]);
      setSuperNursery(superData);
      setFormRegion(superData.region || "");
      setFormDistrict(superData.district || "");
      setFormLocation(superData.location || "");
      setCommunities(allCommunities.data.filter((n) => n.parent_nursery_id === superId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading community nurseries");
    } finally {
      setLoading(false);
    }
  }, [superId]);

  useEffect(() => {
    if (superId) load();
  }, [superId, load]);

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

  const createCommunity = useCallback(async () => {
    if (!superNursery || !name.trim()) return;
    if (!operatorName.trim() || !operatorEmail.trim() || !operatorPassword.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CreateNurseryRequest = {
        name: name.trim(),
        type: "community",
        region: formRegion || superNursery.region,
        district: formDistrict || superNursery.district,
        location: formLocation || superNursery.location,
        capacity: Number(capacity) || 1000,
        parent_nursery_id: superNursery.id,

        // Nursery contact is aligned with the operator account so it can be found easily.
        contact_email: operatorEmail.trim(),
        contact_phone: operatorPhone.trim() || undefined,

        // Provision the dedicated login user that will manage this community nursery.
        community_operator_name: operatorName.trim(),
        community_operator_email: operatorEmail.trim(),
        community_operator_password: operatorPassword,
        community_operator_phone: operatorPhone.trim() || undefined,
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
      setError(e instanceof Error ? e.message : "Failed creating community nursery");
    } finally {
      setSaving(false);
    }
  }, [superNursery, name, capacity, load, formRegion, formDistrict, formLocation, operatorName, operatorEmail, operatorPassword, operatorPhone]);

  const columns = useMemo<Column<Nursery>[]>(
    () => [
      { key: "nursery_id", header: "Code" },
      { key: "name", header: "Community Nursery" },
      { key: "district", header: "District" },
      { key: "capacity", header: "Capacity", render: (row) => row.capacity?.toLocaleString() || "0" },
      { key: "current_stock", header: "Stock", render: (row) => row.current_stock?.toLocaleString() || "0" },
    ],
    []
  );

  const totalCapacity = useMemo(
    () => communities.reduce((sum, n) => sum + (n.capacity || 0), 0),
    [communities]
  );
  const totalStock = useMemo(
    () => communities.reduce((sum, n) => sum + (n.current_stock || 0), 0),
    [communities]
  );
  const stockByCommunityData = useMemo(
    () =>
      communities
        .slice()
        .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
        .slice(0, 8)
        .map((n) => ({ label: n.name, value: n.current_stock || 0 })),
    [communities]
  );

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-h4">Community Nurseries</h1>
              <p className="text-caption opacity-70">
                {superNursery ? `Managing communities under ${superNursery.name}` : "Manage community nursery network"}
              </p>
            </div>
            <Button variant="default" disabled={!superNursery} onClick={() => setIsCreateModalOpen(true)}>
              Add Community Nursery
            </Button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard title="Community Nurseries" value={communities.length} icon={<Store size={20} />} />
            <SummaryCard title="Total Capacity" value={totalCapacity} icon={<Warehouse size={20} />} />
            <SummaryCard title="Current Stock" value={totalStock} icon={<Package size={20} />} />
            <SummaryCard title="Parent Super Nursery" value={superNursery?.name || "-"} icon={<Building2 size={20} />} />
          </div>

          <ChartCard
            title="Stock by Community Nursery"
            description="Community nurseries ranked by available stock."
            type="bar"
            data={stockByCommunityData.length > 0 ? stockByCommunityData : [{ label: "No data", value: 0 }]}
            height={300}
          />

          <DataTable
            data={communities}
            columns={columns}
            title="Community Nurseries"
            description={loading ? "Loading..." : "Roadside/community seedling outlets linked to this super nursery"}
            searchable
            searchPlaceholder="Search communities..."
            searchKeys={["name", "nursery_id"]}
            emptyMessage={loading ? "Loading community nurseries..." : "No community nurseries yet"}
          />

          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Community Nursery" size="xl">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="Community nursery name" value={name} onChange={(e) => setName(e.target.value)} />
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
                    <h3 className="text-base font-medium">Community Nursery Operator Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Create the user account that can log in and manage this community nursery.
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
                <Button onClick={createCommunity} disabled={!superNursery || !name.trim() || !operatorName.trim() || !operatorEmail.trim() || !operatorPassword.trim()} loading={saving}>
                  Add Community Nursery
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NURSERY_ROLES } from "@/src/models/User";
import api, { Nursery, type User } from "@/src/api/client";

export default function NurseryHomePage() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const user = JSON.parse(raw) as { role?: string };
    const role = user.role;

    if (role === "regional_nursery") {
      router.replace("/nursery/collectors");
      return;
    }

    if (role === "super_nursery") {
      // Super nursery operators need quick access to their own community-management page.
      void (async () => {
        const current = user as User & { nursery_id?: string; business_name?: string; email?: string };
        try {
          const res = await api.getNurseries({ type: "super", limit: 500, offset: 0 });
          const rows = res.data || [];

          const byOperator = rows.find((n) => n.operator_id === current.id);
          const nurseryId = current.nursery_id;
          const bySessionId = nurseryId ? rows.find((n) => n.id === nurseryId) : undefined;
          const byEmail =
            current.email && rows.find((n) => n.contact_email && n.contact_email.toLowerCase() === current.email!.toLowerCase());
          const byName =
            current.business_name &&
            rows.find((n) => n.name && current.business_name && n.name.toLowerCase() === current.business_name.toLowerCase());
          const byRegion = current.region ? rows.find((n) => n.region && n.region.toLowerCase() === current.region!.toLowerCase()) : undefined;
          const onlyOne = rows.length === 1 ? rows[0] : undefined;

          const mySuper: Nursery | undefined = byOperator || bySessionId || byEmail || byName || byRegion || onlyOne;
          if (mySuper?.id) {
            router.replace(`/nursery/super-nurseries/${mySuper.id}`);
            return;
          }
        } catch {
          // Ignore and fall back to requests.
        }
        router.replace("/nursery/requests");
      })();
      return;
    }

    router.replace("/nursery/requests");
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={NURSERY_ROLES}>
      <div className="min-h-screen bg-pale" />
    </ProtectedRoute>
  );
}


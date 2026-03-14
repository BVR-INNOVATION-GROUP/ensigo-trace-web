"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@/src/models/User";
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "collector":
      return "/dashboard";
    case "super_nursery":
    case "community_nursery":
    case "regional_nursery":
      return "/nursery";
    case "partner":
      return "/partner";
    default:
      return "/login";
  }
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userStr || !token) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr) as { role: UserRole; is_verified?: boolean };
        const role: UserRole = user.role;

        // If user is not verified, always send them to pending onboarding
        if (user.is_verified === false && pathname !== "/onboarding/pending") {
          router.push("/onboarding/pending");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
          router.push(getDashboardForRole(role));
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pale">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}








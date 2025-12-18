"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@/src/models/User";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
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
        const user = JSON.parse(userStr);

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard based on role
          switch (user.role) {
            case "admin":
              router.push("/admin");
              break;
            case "collector":
              router.push("/dashboard");
              break;
            case "nursery":
              router.push("/nursery");
              break;
            case "partner":
              router.push("/partner");
              break;
            default:
              router.push("/login");
          }
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








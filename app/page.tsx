"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr) as { role: string; is_verified?: boolean };

      if (user.is_verified === false) {
        router.replace("/onboarding/pending");
        return;
      }

      const role = user.role;
      if (role === "admin") router.replace("/admin");
      else if (role === "collector") router.replace("/dashboard");
      else if (
        role === "super_nursery" ||
        role === "community_nursery" ||
        role === "regional_nursery"
      )
        router.replace("/nursery");
      else if (role === "partner") router.replace("/partner");
      else router.replace("/dashboard");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
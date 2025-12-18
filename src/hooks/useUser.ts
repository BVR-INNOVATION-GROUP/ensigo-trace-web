"use client";

import { useState, useEffect } from "react";
import type { User } from "@/src/models/User";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}








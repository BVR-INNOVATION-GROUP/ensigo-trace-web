 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import type { User } from "@/src/models/User";
import { Button } from "@/components/ui/button";

export default function PendingVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const parsed: User = JSON.parse(stored);
      setUser(parsed);

      if (parsed.is_verified) {
        // If already verified, send to their dashboard
        if (parsed.role === "admin") router.replace("/admin");
        else if (
          parsed.role === "super_nursery" ||
          parsed.role === "community_nursery" ||
          parsed.role === "regional_nursery"
        )
          router.replace("/nursery");
        else if (parsed.role === "partner") router.replace("/partner");
        else router.replace("/dashboard");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pale px-4">
      <div className="max-w-md w-full bg-paper rounded-2xl shadow-custom p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
            <Clock size={20} />
          </div>
          <div>
            <h1 className="text-h4">Account pending verification</h1>
            <p className="text-caption text-[var(--very-dark-color)]/70">
              Thanks for registering your regional nursery. A super admin is
              reviewing your details.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--very-dark-color)]/10 bg-pale px-4 py-3 space-y-1">
          <p className="text-body-sm font-medium">
            {user?.business_name || "Your nursery"}
          </p>
          <p className="text-caption text-[var(--very-dark-color)]/70">
            Region: {user?.region || "Not specified"}
          </p>
          <p className="text-caption text-[var(--very-dark-color)]/70">
            Contact: {user?.email}
          </p>
        </div>

        <ul className="space-y-2 text-body-sm text-[var(--very-dark-color)]/80">
          <li className="flex gap-2">
            <CheckCircle2 className="text-primary" size={16} />
            <span>
              You can safely{" "}
              <span className="font-medium">close this window</span>. We&apos;ll
              notify you once your access is granted.
            </span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="text-primary" size={16} />
            <span>
              Once approved, you&apos;ll be able to{" "}
              <span className="font-medium">
                create super and community nurseries, and add collectors
              </span>{" "}
              to your network.
            </span>
          </li>
        </ul>

        <div className="flex items-center justify-between gap-3">
          <Button variant="pale" size="sm" onClick={handleLogout}>
            Log out
          </Button>
          <Link
            href="/login"
            className="text-caption text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}


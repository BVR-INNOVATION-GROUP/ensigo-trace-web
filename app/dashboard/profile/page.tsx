"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BusinessProfile } from "@/components/dashboard/business-profile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Settings,
    Shield,
    Bell,
    LogOut,
    Key,
    HelpCircle,
    FileText,
    BadgeCheck,
    Calendar,
    Hash,
    Briefcase,
    TrendingUp,
    Leaf,
    Package,
} from "lucide-react";
import type { User } from "@/src/models/User";
import { useRouter } from "next/navigation";
import api from "@/src/api/client";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<{
        total_collections: number;
        approved_collections: number;
        pending_collections: number;
        total_quantity: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const userData = localStorage.getItem("user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
            
            // Try to fetch stats
            try {
                                const statsData = await api.getMyStats();
                                setStats({
                                    total_collections: statsData.total_collections,
                                    approved_collections: statsData.approved,
                                    pending_collections: statsData.pending_reviews,
                                    total_quantity: statsData.total_quantity,
                                });
            } catch {
                // Stats not available for this user type
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
            case "super_nursery":
            case "community_nursery":
            case "regional_nursery":
                return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
            case "collector":
                return "bg-green-500/10 text-green-700 dark:text-green-400";
            case "partner":
                return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
            default:
                return "bg-pale text-[var(--very-dark-color)]";
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="w-full h-[calc(100vh-140px)] flex flex-col">
                    {/* Header Skeleton */}
                    <div className="mb-6 flex-shrink-0">
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                        {/* Main Profile Skeleton */}
                        <div className="lg:col-span-2 overflow-y-auto pr-2 scrollbar-thin">
                            <div className="space-y-6 pb-4">
                                <div className="bg-[var(--card)] rounded-xl overflow-hidden">
                                    <Skeleton className="h-36 w-full" />
                                    <div className="p-6">
                                        <div className="flex items-end gap-4 -mt-14 mb-6">
                                            <Skeleton className="w-28 h-28 rounded-2xl border-4 border-[var(--card)]" />
                                            <div className="flex-1 pt-12">
                                                <Skeleton className="h-6 w-40 mb-2" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Skeleton className="h-20 w-full rounded-lg" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Skeleton className="h-16 rounded-lg" />
                                                <Skeleton className="h-16 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="overflow-y-auto pl-2 scrollbar-thin">
                            <div className="space-y-4 pb-4">
                                <div className="bg-[var(--card)] rounded-xl p-4">
                                    <Skeleton className="h-5 w-32 mb-4" />
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2">
                                            <Skeleton className="w-9 h-9 rounded-lg" />
                                            <div className="flex-1">
                                                <Skeleton className="h-3 w-16 mb-1" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-[var(--card)] rounded-xl p-4">
                                    <Skeleton className="h-5 w-24 mb-4" />
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2">
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                            <Skeleton className="h-4 w-28" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-[var(--very-dark-color)]/60 mb-4">Unable to load profile</p>
                    <Button onClick={() => router.push("/login")}>
                        Go to Login
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full h-[calc(100vh-140px)] flex flex-col">
                {/* Header */}
                <div className="mb-6 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-[var(--very-dark-color)]">My Profile</h1>
                    <p className="text-[var(--very-dark-color)]/60 mt-1">
                        Manage your business profile and account settings
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                    {/* Main Profile Section - Independent Scroll */}
                    <div className="lg:col-span-2 overflow-y-auto pr-2 scrollbar-thin">
                        <div className="space-y-6 pb-4">
                        <BusinessProfile
                            user={user}
                            onUpdate={handleUserUpdate}
                            editable={true}
                        />

                        {/* Activity Stats */}
                        {stats && (
                            <div className="bg-[var(--card)] rounded-xl p-6">
                                <h3 className="font-semibold text-[var(--very-dark-color)] mb-5 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <TrendingUp size={16} className="text-primary" />
                                    </div>
                                    Collection Activity
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-pale rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-caption text-[var(--very-dark-color)]/60">Total</span>
                                            <Package size={16} className="text-primary" />
                                        </div>
                                        <p className="text-xl font-semibold">{stats.total_collections}</p>
                                    </div>
                                    <div className="bg-pale rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-caption text-[var(--very-dark-color)]/60">Approved</span>
                                            <BadgeCheck size={16} className="text-primary" />
                                        </div>
                                        <p className="text-xl font-semibold">{stats.approved_collections}</p>
                                    </div>
                                    <div className="bg-pale rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-caption text-[var(--very-dark-color)]/60">Pending</span>
                                            <Calendar size={16} className="text-primary" />
                                        </div>
                                        <p className="text-xl font-semibold">{stats.pending_collections}</p>
                                    </div>
                                    <div className="bg-pale rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-caption text-[var(--very-dark-color)]/60">Quantity</span>
                                            <Leaf size={16} className="text-primary" />
                                        </div>
                                        <p className="text-xl font-semibold">
                                            {stats.total_quantity.toFixed(1)}
                                            <span className="text-sm font-normal ml-0.5">kg</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Sidebar - Independent Scroll */}
                    <div className="overflow-y-auto pl-2 scrollbar-thin">
                        <div className="space-y-4">
                        {/* Account Info Card */}
                        <div className="bg-[var(--card)] rounded-xl overflow-hidden">
                            <div className="p-4 bg-pale/50">
                                <h2 className="font-semibold text-[var(--very-dark-color)]">Account Info</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Hash size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--very-dark-color)]/50">Business ID</p>
                                        <p className="font-mono text-sm font-medium text-primary truncate">
                                            {user.business_id}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Briefcase size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--very-dark-color)]/50">Account Type</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                            {user.role.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <BadgeCheck size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--very-dark-color)]/50">Status</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            user.is_verified
                                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                                : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                        }`}>
                                            {user.is_verified ? "Verified" : "Pending Verification"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Calendar size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--very-dark-color)]/50">Member Since</p>
                                        <p className="text-sm font-medium text-[var(--very-dark-color)]">
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                  })
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Menu */}
                        <div className="bg-[var(--card)] rounded-xl overflow-hidden">
                            <div className="p-4 bg-pale/50">
                                <h2 className="font-semibold text-[var(--very-dark-color)]">Settings</h2>
                            </div>
                            <div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pale flex items-center justify-center">
                                            <Settings size={16} className="text-[var(--very-dark-color)]/60" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">General Settings</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pale flex items-center justify-center">
                                            <Bell size={16} className="text-[var(--very-dark-color)]/60" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">Notifications</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pale flex items-center justify-center">
                                            <Key size={16} className="text-[var(--very-dark-color)]/60" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">Change Password</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pale flex items-center justify-center">
                                            <Shield size={16} className="text-[var(--very-dark-color)]/60" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">Privacy & Security</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                            </div>
                        </div>

                        {/* Help & Support */}
                        <div className="bg-[var(--card)] rounded-xl overflow-hidden">
                            <div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <HelpCircle size={16} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">Help & Support</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                                <div className="w-full flex items-center justify-between p-4 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pale flex items-center justify-center">
                                            <FileText size={16} className="text-[var(--very-dark-color)]/60" />
                                        </div>
                                        <span className="text-sm text-[var(--very-dark-color)]">Terms & Privacy</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--very-dark-color)]/40 uppercase tracking-wide">Soon</span>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <Button
                            onClick={handleLogout}
                            variant="pale"
                            className="w-full text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut size={18} className="mr-2" />
                            Sign Out
                        </Button>

                        {/* App Version */}
                        <p className="text-center text-xs text-[var(--very-dark-color)]/30 pb-4">
                            EnsigoTrace v1.0.0
                        </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

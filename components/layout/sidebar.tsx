"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import {
    LayoutGrid,
    User,
    Settings,
    Sprout,
    Building2,
    TreePine,
    Package,
    ShoppingCart,
    ClipboardList,
    Target,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/src/hooks/useUser";
import { useSidebar } from "./sidebar-context";
import type { UserRole } from "@/src/models/User";
import { NURSERY_ROLES, USER_ROLES } from "@/src/models/User";

interface MenuItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    roles: UserRole[];
}

const allMenuItems: MenuItem[] = [
    // Collector
    { href: "/dashboard", label: "My Collections", icon: LayoutGrid, roles: ["collector"] },

    // Admin
    { href: "/admin/nurseries", label: "Nurseries", icon: Building2, roles: ["admin"] },
    { href: "/admin/mother-trees-species", label: "Mother Trees & Species", icon: TreePine, roles: ["admin"] },

    // Nursery role-specific flow
    { href: "/nursery/collectors", label: "Collectors", icon: User, roles: ["regional_nursery"] },
    { href: "/nursery/regional-inventory", label: "Regional Inventory", icon: Package, roles: ["regional_nursery"] },
    { href: "/nursery/regional-orders", label: "Regional Orders", icon: ClipboardList, roles: ["regional_nursery"] },
    { href: "/nursery/super-nurseries", label: "Super Nurseries", icon: Building2, roles: ["regional_nursery"] },
    { href: "/nursery/requests", label: "Inventory Requests", icon: Package, roles: NURSERY_ROLES },
    { href: "/nursery/inventory", label: "Inventory", icon: Sprout, roles: ["super_nursery", "community_nursery"] },
    { href: "/nursery/sales", label: "POS Sales", icon: ShoppingCart, roles: ["community_nursery"] },

    // Partner
    { href: "/partner", label: "Dashboard", icon: LayoutGrid, roles: ["partner"] },
    { href: "/partner/browse", label: "Browse Seeds", icon: ShoppingCart, roles: ["partner"] },
    { href: "/partner/projects", label: "My Projects", icon: Target, roles: ["partner"] },

    // Common (all DB roles)
    { href: "/dashboard/profile", label: "Profile", icon: User, roles: USER_ROLES },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: USER_ROLES },
];

const SIDEBAR_WIDTH = "w-64 md:w-64 lg:w-[17%] lg:min-w-[220px] lg:max-w-[320px]";

function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
    const pathname = usePathname();
    const { user, isLoading } = useUser();

    const menuItems = user
        ? allMenuItems.filter((item) => item.roles.includes(user.role))
        : [];

    return (
        <>
            <div className="flex items-start justify-between gap-2 p-4 sm:p-6 pb-6 sm:pb-8">
                <div className="min-w-0 flex-1">
                    <p style={{ fontFamily: "iMPACT" }} className="text-h3 truncate">
                        ENSIGO <span className="text-primary">TRACE</span>
                    </p>
                    <small className="text-caption opacity-70">
                        Empowering information
                    </small>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="md:hidden p-2 rounded-lg hover:bg-pale transition-colors flex-shrink-0"
                    >
                        <X size={22} />
                    </button>
                )}
            </div>

            <div className="px-4 sm:px-6 mb-8 flex-1 overflow-y-auto">
                <p className="text-overline mb-4 opacity-50">MENU</p>
                <nav className="space-y-1">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg animate-pulse">
                                <div className="size-4 rounded bg-[var(--border)]" />
                                <div className="h-4 flex-1 max-w-[120px] rounded bg-[var(--border)]" />
                            </div>
                        ))
                    ) : (
                        menuItems.map((item) => {
                            const Icon = item.icon;
                            let isActive = false;
                            if (item.href === "/dashboard" || item.href === "/admin" || item.href === "/partner") {
                                isActive = pathname === item.href;
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors min-h-[44px] sm:min-h-0",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-body hover:bg-pale"
                                    )}
                                >
                                    <Icon size={16} />
                                    <span className="text-body truncate">{item.label}</span>
                                </Link>
                            );
                        })
                    )}
                </nav>
            </div>
        </>
    );
}

export function Sidebar() {
    const { isOpen, close } = useSidebar();

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.button
                        key="sidebar-backdrop"
                        type="button"
                        aria-label="Close menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        onClick={close}
                        className="fixed inset-0 z-40 bg-black/50 dark:bg-black/60 backdrop-blur-[2px] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar: desktop always visible, mobile as drawer */}
            <aside
                className={cn(
                    "flex flex-col border-r border-[var(--border)] overflow-hidden transition-transform duration-200 ease-out bg-[var(--card)] h-full",
                    "md:relative md:translate-x-0 md:flex-shrink-0",
                    SIDEBAR_WIDTH,
                    "fixed inset-y-0 left-0 z-50 md:static",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <SidebarContent onNavigate={close} onClose={close} />
            </aside>
        </>
    );
}

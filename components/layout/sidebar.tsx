"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutGrid,
    User,
    Settings,
    Database,
    Sprout,
    BarChart3,
    Building2,
    FolderTree,
    MapPin,
    Package,
    ShoppingCart,
    Target,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/src/hooks/useUser";
import type { UserRole } from "@/src/models/User";

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
    { href: "/admin", label: "Dashboard", icon: LayoutGrid, roles: ["admin"] },
    { href: "/admin/batches", label: "Seed Batches", icon: Database, roles: ["admin"] },
    { href: "/admin/nurseries", label: "Nurseries", icon: Building2, roles: ["admin"] },
    { href: "/admin/projects", label: "Projects", icon: FolderTree, roles: ["admin"] },
    { href: "/admin/provenance", label: "Provenance", icon: MapPin, roles: ["admin"] },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
    
    // Nursery
    { href: "/nursery", label: "Dashboard", icon: LayoutGrid, roles: ["nursery"] },
    { href: "/nursery/inventory", label: "Inventory", icon: Package, roles: ["nursery"] },
    { href: "/nursery/germination", label: "Germination", icon: Sprout, roles: ["nursery"] },
    { href: "/nursery/sales", label: "Sales", icon: ShoppingCart, roles: ["nursery"] },
    
    // Partner
    { href: "/partner", label: "Dashboard", icon: LayoutGrid, roles: ["partner"] },
    { href: "/partner/browse", label: "Browse Seeds", icon: ShoppingCart, roles: ["partner"] },
    { href: "/partner/projects", label: "My Projects", icon: Target, roles: ["partner"] },
    
    // Common (at the end)
    { href: "/dashboard/profile", label: "Profile", icon: User, roles: ["collector", "nursery", "partner", "admin"] },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["collector", "nursery", "partner", "admin"] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useUser();

    return (
        <div className="w-[17%] bg-paper h-[calc(100vh)] flex flex-col border-r border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 p-6 pb-8">
                <div>
                    <p style={{ fontFamily: "iMPACT" }} className="text-h3">
                        ENSIGO <span className="text-primary">TRACE</span>
                    </p>
                    <small className="text-[10px] opacity-70">
                        Empowering information
                    </small>
                </div>
            </div>

            <div className="px-6 mb-8 flex-1 overflow-y-auto">
                <motion.p
                    className="text-overline mb-4 opacity-50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 0.5, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    MENU
                </motion.p>
                <nav className="space-y-2">
                    {allMenuItems
                        .filter((item) => !user || item.roles.includes(user.role))
                        .map((item, index) => {
                            const Icon = item.icon;
                            let isActive = false;
                            if (item.href === "/dashboard" || item.href === "/admin" || item.href === "/nursery" || item.href === "/partner") {
                                isActive = pathname === item.href;
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary "
                                                : "text-body hover:bg-pale"
                                        )}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Icon size={18} />
                                        </motion.div>
                                        <span>{item.label}</span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                </nav>
            </div>
        </div>
    );
}


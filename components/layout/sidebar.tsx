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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/src/hooks/useUser";
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
    { href: "/admin", label: "Dashboard", icon: LayoutGrid, roles: ["admin"] },
    { href: "/admin/batches", label: "Seed Batches", icon: Database, roles: ["admin"] },
    { href: "/admin/nurseries", label: "Nurseries", icon: Building2, roles: ["admin"] },
    { href: "/admin/projects", label: "Projects", icon: FolderTree, roles: ["admin"] },
    { href: "/admin/provenance", label: "Provenance", icon: MapPin, roles: ["admin"] },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
    
    // Nursery (DB roles: super_nursery, community_nursery, regional_nursery)
    { href: "/nursery", label: "Dashboard", icon: LayoutGrid, roles: NURSERY_ROLES },
    { href: "/nursery/inventory", label: "Inventory", icon: Package, roles: NURSERY_ROLES },
    { href: "/nursery/germination", label: "Germination", icon: Sprout, roles: NURSERY_ROLES },
    { href: "/nursery/sales", label: "Sales", icon: ShoppingCart, roles: NURSERY_ROLES },
    
    // Partner
    { href: "/partner", label: "Dashboard", icon: LayoutGrid, roles: ["partner"] },
    { href: "/partner/browse", label: "Browse Seeds", icon: ShoppingCart, roles: ["partner"] },
    { href: "/partner/projects", label: "My Projects", icon: Target, roles: ["partner"] },
    
    // Common (all DB roles)
    { href: "/dashboard/profile", label: "Profile", icon: User, roles: USER_ROLES },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: USER_ROLES },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, isLoading } = useUser();

    // Only show items for the current user's role. When user isn't loaded yet, show nothing
    // to avoid flashing the full list then filtering (was: !user || item.roles.includes(user.role))
    const menuItems = user
        ? allMenuItems.filter((item) => item.roles.includes(user.role))
        : [];

    return (
        <div className="w-[17%] bg-[var(--card)] h-[calc(100vh)] flex flex-col border-r border-[var(--border)] overflow-hidden transition-colors">
            <div className="flex items-center gap-2 p-6 pb-8">
                <div>
                    <p style={{ fontFamily: "iMPACT" }} className="text-h3">
                        ENSIGO <span className="text-primary">TRACE</span>
                    </p>
                    <small className="text-caption opacity-70">
                        Empowering information
                    </small>
                </div>
            </div>

            <div className="px-6 mb-8 flex-1 overflow-y-auto">
                <p className="text-overline mb-4 opacity-50">MENU</p>
                <nav className="space-y-1">
                    {isLoading ? (
                        // Skeleton so layout doesn't jump when user loads
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
                            if (item.href === "/dashboard" || item.href === "/admin" || item.href === "/nursery" || item.href === "/partner") {
                                isActive = pathname === item.href;
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-body hover:bg-pale"
                                    )}
                                >
                                    <Icon size={16} />
                                    <span className="text-body">{item.label}</span>
                                </Link>
                            );
                        })
                    )}
                </nav>
            </div>
        </div>
    );
}

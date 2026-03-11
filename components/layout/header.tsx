"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut } from "lucide-react";
import Image from "next/image";
import api from "@/src/api/client";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ThemeToggle } from "@/components/theme";

export function Header() {
    const [showDropdown, setShowDropdown] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [profilePhoto, setProfilePhoto] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const router = useRouter();

    const fetchUnreadCount = useCallback(async () => {
        try {
            const result = await api.getUnreadNotificationCount();
            setUnreadCount(result.count);
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    }, []);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            const userData = JSON.parse(user);
            setUserEmail(userData.email || "");
            setUserName(userData.name || "");
            setProfilePhoto(userData.profile_photo || "");
        }

        // Fetch unread count on mount
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showDropdown]);

    const handleLogout = async () => {
        try {
            const { AuthService } = await import("@/src/services/AuthService");
            const authService = new AuthService();
            await authService.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
        }
    };

    const handleNotificationClose = () => {
        setIsNotificationsOpen(false);
        // Refresh unread count after closing panel
        fetchUnreadCount();
    };

    return (
        <>
            <div className="h-16 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-end px-6 gap-4 transition-colors">
                <ThemeToggle />
                <button
                    onClick={() => setIsNotificationsOpen(true)}
                    className="relative p-2 rounded-lg hover:bg-pale transition-colors"
                >
                    <Bell size={20} strokeWidth={2} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0 -right-0 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>
                <div className="relative" ref={avatarRef}>
                    <button
                        type="button"
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="w-10 h-10 rounded-full overflow-hidden bg-pale cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-expanded={showDropdown}
                        aria-haspopup="true"
                    >
                        {profilePhoto ? (
                            <Image
                                src={profilePhoto}
                                alt={userName || "User"}
                                width={40}
                                height={40}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-sm font-medium text-primary">
                                {userName ? userName.charAt(0).toUpperCase() : "U"}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-12 w-56 bg-[var(--card)] rounded-lg shadow-custom border border-[var(--border)] z-50 py-2">
                            <div className="px-4 py-3 border-b border-[var(--very-dark-color)]/10">
                                <p className="text-label font-medium mb-1 truncate">{userName || "User"}</p>
                                <p className="text-caption truncate">{userEmail || "user@example.com"}</p>
                            </div>
                            <button
                                onClick={() => {
                                    router.push("/dashboard/profile");
                                    setShowDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-body hover:bg-pale transition-colors flex items-center gap-3"
                            >
                                <User size={16} />
                                <span>Profile Settings</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-left text-body hover:bg-pale transition-colors flex items-center gap-3 text-red-600"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={handleNotificationClose}
            />
        </>
    );
}

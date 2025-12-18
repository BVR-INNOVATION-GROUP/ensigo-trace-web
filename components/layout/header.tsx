"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Settings, LogOut } from "lucide-react";
import Image from "next/image";

export function Header() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const router = useRouter();

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            const userData = JSON.parse(user);
            setUserEmail(userData.email || "");
        }
    }, []);

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

    return (
        <div className="h-16 border-b border-gray-200 bg-paper flex items-center justify-end px-6 gap-8">
            <div className="relative cursor-pointer">
                <Bell size={20} strokeWidth={2} />
                <span className="absolute -top-0 -right-1 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center text-white text-caption z-10">
                    {/* 4 */}
                </span>
            </div>
            <div
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
            >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-pale cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                        alt="User"
                        width={40}
                        height={40}
                        className="object-cover"
                    />
                </div>

                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-12 w-56 bg-paper rounded-lg shadow-lg border border-[var(--very-dark-color)]/10 z-50 py-2"
                            onMouseEnter={() => setShowDropdown(true)}
                            onMouseLeave={() => setShowDropdown(false)}
                        >
                            <div className="px-4 py-3 border-b border-[var(--very-dark-color)]/10">
                                <p className="text-label mb-1">Email</p>
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


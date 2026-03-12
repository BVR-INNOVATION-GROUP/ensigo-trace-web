"use client";

import { motion } from "framer-motion";
import { SidebarProvider } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen min-h-[100dvh] bg-pale overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Header />
                    <main className="flex-1 pt-4 sm:pt-6 px-4 sm:px-6 overflow-y-auto overflow-x-hidden pb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="min-w-0"
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}


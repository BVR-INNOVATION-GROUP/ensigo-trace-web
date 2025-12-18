"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-pale overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 pt-6 pr-6 overflow-y-auto mb-6" style={{ paddingLeft: "1.5rem" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}


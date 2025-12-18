"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  cardImage: 1 | 2 | 3;
  index?: number;
}

export function SummaryCard({ title, value, icon, cardImage, index = 0 }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-lg overflow-hidden shadow-custom bg-paper" 
      style={{ height: "120px" }}
    >
      <div className="h-full p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="text-label">{title}</p>
          <motion.div 
            className="text-primary"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {icon}
          </motion.div>
        </div>
        <motion.p 
          style={{ fontSize: "24px" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}


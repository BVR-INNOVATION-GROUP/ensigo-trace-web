"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    showCloseButton = true,
    closeOnOverlayClick = true,
    className,
}: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeOnOverlayClick ? onClose : undefined}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "bg-paper rounded-lg w-full max-h-[85vh] flex flex-col shadow-custom",
                            sizeClasses[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(title || showCloseButton) && (
                            <div className={cn(
                                "flex items-center p-6 border-b border-[var(--very-dark-color)]/10 flex-shrink-0",
                                title && showCloseButton ? "justify-between" : "justify-end"
                            )}>
                                {title && (
                                    <h2 className="text-h5">{title}</h2>
                                )}
                                {showCloseButton && (
                                    <IconButton size="md" onClick={onClose}>
                                        <X size={20} />
                                    </IconButton>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


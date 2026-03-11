"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type DialogType = "danger" | "warning" | "info" | "success";

interface ConfirmOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  const getIcon = (type: DialogType = "warning") => {
    const icons = {
      danger: <Trash2 size={24} />,
      warning: <AlertTriangle size={24} />,
      info: <Info size={24} />,
      success: <CheckCircle size={24} />,
    };
    return icons[type];
  };

  const getIconColor = (type: DialogType = "warning") => {
    const colors = {
      danger: "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400",
      warning: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
      info: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      success: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    };
    return colors[type];
  };

  const getConfirmButtonVariant = (type: DialogType = "warning") => {
    return type === "danger" ? "destructive" : "default";
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={handleCancel}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-paper rounded-lg shadow-custom overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-full", getIconColor(options.type))}>
                      {getIcon(options.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h5 mb-2">{options.title}</h3>
                      <p className="text-body text-[var(--very-dark-color)]/70">
                        {options.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-pale border-t border-[var(--very-dark-color)]/10">
                  <Button
                    variant="pale"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    {options.cancelText || "Cancel"}
                  </Button>
                  <Button
                    variant={getConfirmButtonVariant(options.type)}
                    onClick={handleConfirm}
                    loading={isLoading}
                  >
                    {options.confirmText || "Confirm"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

// Standalone alert component for simple alerts
interface AlertProps {
  type?: DialogType;
  title: string;
  message: string;
  className?: string;
}

export function Alert({ type = "info", title, message, className }: AlertProps) {
  const colors = {
    danger: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
    success: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
  };

  const icons = {
    danger: <XCircle size={18} className="text-red-500 dark:text-red-400" />,
    warning: <AlertTriangle size={18} className="text-yellow-500 dark:text-yellow-400" />,
    info: <Info size={18} className="text-blue-500 dark:text-blue-400" />,
    success: <CheckCircle size={18} className="text-green-500 dark:text-green-400" />,
  };

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-lg border", colors[type], className)}>
      {icons[type]}
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
    </div>
  );
}

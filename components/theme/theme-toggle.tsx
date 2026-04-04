"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={menuRef}>
      {/* <Button
        variant="pale"
        size="icon-sm"
        > */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle theme"

      >

        <CurrentIcon size={20} />
      </button>
      {/* </Button> */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="theme-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="absolute right-0 mt-2 w-36 rounded-md bg-[var(--card)] shadow-custom border border-[var(--border)] z-50 origin-top-right"
          >
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-body hover:bg-[var(--card-hover)] transition-colors",
                    theme === option.value && "text-primary"
                  )}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple toggle button (just switches between light/dark)
export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="pale"
      size="icon-sm"
      onClick={toggleTheme}
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}

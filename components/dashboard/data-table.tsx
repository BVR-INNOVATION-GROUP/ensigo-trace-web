"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  description?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  maxHeight?: string;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  title,
  description,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKeys = [],
  actions,
  onRowClick,
  emptyMessage = "No data available",
  maxHeight = "500px",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery || searchKeys.length === 0) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === "number") {
          return value.toString().includes(query);
        }
        return false;
      })
    );
  }, [data, searchQuery, searchKeys]);

  return (
    <div className="bg-paper rounded-lg shadow-custom overflow-hidden">
      {(title || searchable) && (
        <div className="p-4 border-b border-[var(--very-dark-color)]/10">
          <div className="flex items-center justify-between gap-4">
            {title && (
              <div>
                <h3 className="text-h5">{title}</h3>
                {description && (
                  <p className="text-caption text-[var(--very-dark-color)]/60">{description}</p>
                )}
              </div>
            )}
            {searchable && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--very-dark-color)]/40" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-pale rounded-lg text-sm w-64 border-0 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-paper z-10">
            <tr className="border-b border-[var(--very-dark-color)]/10">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-label font-medium text-[var(--very-dark-color)]/70",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-label font-medium text-[var(--very-dark-color)]/70">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--very-dark-color)]/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <motion.tr
                  key={item.id ?? index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                  className={cn(
                    "border-b border-[var(--very-dark-color)]/5 hover:bg-pale/50 transition-colors",
                    onRowClick && "cursor-pointer",
                    index === filteredData.length - 1 && "border-b-0"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn("px-4 py-3", column.className)}>
                      {column.render
                        ? column.render(item, index)
                        : String((item as Record<string, unknown>)[String(column.key)] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">{actions(item)}</td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--very-dark-color)]/10 text-caption text-[var(--very-dark-color)]/60">
          Showing {filteredData.length} of {data.length} items
        </div>
      )}
    </div>
  );
}

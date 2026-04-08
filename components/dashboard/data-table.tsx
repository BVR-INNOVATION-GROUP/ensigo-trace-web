"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
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
  pagination?: {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function formatCellNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  pagination,
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
        <div className="p-4 border-b border-(--very-dark-color)/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {title && (
              <div>
                <h3 className="text-h5">{title}</h3>
                {description && (
                  <p className="text-caption text-(--very-dark-color)/60">{description}</p>
                )}
              </div>
            )}
            {searchable && (
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--very-dark-color)/40" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-10 pr-4 bg-pale rounded-lg text-body w-full sm:w-80 md:w-96 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full min-w-[520px] md:min-w-[680px]">
          <thead className="sticky top-0 bg-paper z-10">
            <tr className="border-b border-(--very-dark-color)/10">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-label font-medium text-(--very-dark-color)/70 whitespace-nowrap",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-label font-medium text-(--very-dark-color)/70">
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
                  className="px-4 py-12 text-center text-(--very-dark-color)/50"
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
                    "border-b border-(--very-dark-color)/5 hover:bg-pale/50 transition-colors",
                    onRowClick && "cursor-pointer",
                    index === filteredData.length - 1 && "border-b-0"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn("px-4 py-3 align-top", column.className)}>
                      {column.render
                        ? column.render(item, index)
                        : (() => {
                          const value = (item as Record<string, unknown>)[String(column.key)];
                          if (typeof value === "number") {
                            return formatCellNumber(value);
                          }
                          return String(value ?? "");
                        })()}
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
        <div className="px-4 py-3 border-t border-(--very-dark-color)/10 flex items-center justify-between">
          <div className="text-caption text-(--very-dark-color)/60">
            {pagination
              ? `Showing ${(pagination.currentPage - 1) * pagination.pageSize + 1}-${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of ${pagination.totalItems} items`
              : `Showing ${filteredData.length} of ${data.length} items`
            }
          </div>
          {pagination && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-md border border-(--very-dark-color)/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pale/50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-(--very-dark-color)/70 px-2">
                Page {pagination.currentPage} of {Math.ceil(pagination.totalItems / pagination.pageSize)}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.pageSize)}
                className="p-2 rounded-md border border-(--very-dark-color)/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pale/50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

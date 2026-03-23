"use client";

import { motion } from "framer-motion";
import { Eye, Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import type { SeedCollectionI } from "@/src/models/SeedCollection";
import Image from "next/image";

const DEFAULT_SEED_IMAGE =
    "https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg?auto=compress&cs=tinysrgb&w=800";

interface SeedBatchTableProps {
    collections: SeedCollectionI[];
    onView: (collection: SeedCollectionI) => void;
    onEdit: (collection: SeedCollectionI) => void;
}

export function SeedBatchTable({ collections, onView, onEdit }: SeedBatchTableProps) {
    const formatQuantity = (value: number) => {
        if (!Number.isFinite(value)) {
            return "0.00";
        }
        return value.toFixed(2);
    };

    const resolvePhoto = (collection: SeedCollectionI) => {
        const candidate = collection.photos?.find(
            (photo) => typeof photo === "string" && (photo.startsWith("http://") || photo.startsWith("https://"))
        );
        return candidate || DEFAULT_SEED_IMAGE;
    };

    return (
        <div className="mt-8">
            <div className="mb-4">
                <h2 className="text-h5 mb-1">
                    MY COLLECTIONS
                </h2>
                <p className="text-caption">
                    Recent submissions with status, date, and destination context
                </p>
            </div>

            <div className="bg-paper rounded-lg shadow-custom overflow-hidden">
                <div className="overflow-auto" style={{ maxHeight: "600px" }}>
                    <table className="w-full min-w-[680px]">
                        <thead className="sticky top-0 h-[7vh] bg-paper z-10">
                            <tr className="bg-paper border-b border-pale">
                                <th className="px-6 py-3 text-left text-label">
                                    Species
                                </th>
                                <th className="px-6 py-3 text-left text-label">
                                    Mother Tree
                                </th>
                                <th className="px-6 py-3 text-left text-label">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-label">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-label">
                                    Collected
                                </th>
                                <th className="px-6 py-3 text-right text-label">
                                    {/* Actions */}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {collections.map((collection, index) => (
                                <motion.tr
                                    key={collection.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={cn(
                                        "border-b border-pale hover:bg-pale/50 transition-colors",
                                        index === collections.length - 1 && "border-b-0"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-pale flex items-center justify-center overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={resolvePhoto(collection)}
                                                    alt={collection.species || "Tree"}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <span className="text-body">
                                                {collection.species || "Unknown Species"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-body">
                                            {collection.motherTree}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-body">
                                            {formatQuantity(collection.quantity)} {collection.unit.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs capitalize text-primary">
                                            {collection.status || "pending"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-body">
                                            {collection.collection_date
                                                ? new Date(collection.collection_date).toLocaleDateString()
                                                : collection.submitted_at
                                                    ? new Date(collection.submitted_at).toLocaleDateString()
                                                    : "-"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <IconButton
                                                size="md"
                                                onClick={() => onView(collection)}
                                            >
                                                <Eye size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="md"
                                                onClick={() => onEdit(collection)}
                                            >
                                                <Pencil size={16} />
                                            </IconButton>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


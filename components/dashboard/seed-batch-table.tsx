"use client";

import { motion } from "framer-motion";
import { Eye, Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import type { SeedCollectionI } from "@/src/models/SeedCollection";
import Image from "next/image";

interface SeedBatchTableProps {
    collections: SeedCollectionI[];
    onView: (collection: SeedCollectionI) => void;
    onEdit: (collection: SeedCollectionI) => void;
}

export function SeedBatchTable({ collections, onView, onEdit }: SeedBatchTableProps) {
    return (
        <div className="mt-8">
            <div className="mb-4">
                <h2 className="text-h5 mb-1">
                    MY SEED BATCH
                </h2>
                <p className="text-caption">
                    Your recent seed collection submissions
                </p>
            </div>

            <div className="bg-paper rounded-lg shadow-custom overflow-hidden">
                <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
                    <table className="w-full">
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
                                                    src={collection.photos?.[0] || "https://images.unsplash.com/photo-1462143338528-eca9936a4d09?w=100"}
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
                                            {collection.quantity} {collection.unit.toUpperCase()}
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


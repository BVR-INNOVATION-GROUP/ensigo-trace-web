"use client";

import { Modal } from "@/components/ui/modal";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { CollectionMap } from "./collection-map";
import type { SeedCollectionI } from "@/src/models/SeedCollection";
import Image from "next/image";

interface CollectionDetailsModalProps {
    collection: SeedCollectionI;
    isOpen: boolean;
    onClose: () => void;
}

export function CollectionDetailsModal({
    collection,
    isOpen,
    onClose,
}: CollectionDetailsModalProps) {
    const formatQuantity = (value: number) => {
        if (!Number.isFinite(value)) {
            return "0.00";
        }
        return value.toFixed(2);
    };

    const photos =
        collection.photos?.filter((photo) => typeof photo === "string" && (photo.startsWith("http://") || photo.startsWith("https://"))) ||
        [];
    const displayPhotos = photos.length
        ? photos
        : ["https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg?auto=compress&cs=tinysrgb&w=1200"];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
        // className="rounded-4xl"
        >
            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-h5 mb-1">
                                {collection.species || "Unknown Species"}
                            </h2>
                            <p className="text-caption text-primary">
                                {collection.motherTree}
                            </p>
                        </div>
                        <span className="inline-block bg-primary/10 px-3 py-1.5 rounded-full text-label whitespace-nowrap">
                            {formatQuantity(collection.quantity)} {collection.unit.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Image Carousel and Map Row */}
                <div className="grid grid-cols-2 gap-6 items-start">
                    {/* Image Carousel */}
                    <div className="space-y-2">
                        <h3 className="text-h6">Photos</h3>
                        <Carousel className="w-full">
                            <CarouselContent>
                                {displayPhotos.map((photo, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative w-full h-80 rounded-lg overflow-hidden bg-pale">
                                            <Image
                                                src={photo}
                                                alt={`${collection.species || "Tree"} - Image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, 50%"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {displayPhotos.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2 bg-black/50 hover:bg-black/70 text-white border-0" />
                                    <CarouselNext className="right-2 bg-black/50 hover:bg-black/70 text-white border-0" />
                                </>
                            )}
                        </Carousel>
                    </div>

                    {/* Map Section */}
                    <div className="space-y-2">
                        <h3 className="text-h6">Location</h3>
                        <div className="h-80">
                            <CollectionMap
                                latitude={collection.latitude}
                                longitude={collection.longitude}
                                location={collection.latitude && collection.longitude ? "Collection Location" : undefined}
                            />
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                    <h3 className="text-h6">Description</h3>
                    <p className="text-body-sm leading-relaxed">
                        {collection.additionalInfo ||
                            "No additional information provided for this collection."}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--very-dark-color)]/10">
                    <div>
                        <p className="text-caption opacity-75 mb-1">Species</p>
                        <p className="text-label">{collection.species || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-caption opacity-75 mb-1">Mother Tree</p>
                        <p className="text-label">{collection.motherTree || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-caption opacity-75 mb-1">Quantity</p>
                        <p className="text-label">
                            {formatQuantity(collection.quantity)} {collection.unit.toUpperCase()}
                        </p>
                    </div>
                    {collection.latitude && collection.longitude && (
                        <div>
                            <p className="text-caption opacity-75 mb-1">Coordinates</p>
                            <p className="text-label">
                                {collection.latitude.toFixed(2)}, {collection.longitude.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

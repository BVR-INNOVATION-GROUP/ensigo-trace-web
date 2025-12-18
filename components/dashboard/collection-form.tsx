"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, PinIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";
import type { SeedCollectionI } from "@/src/models/SeedCollection";

const speciesOptions = [
    { value: "Albizia coriaria", label: "Albizia coriaria" },
    { value: "Ariaewal zink", label: "Ariaewal zink" },
    { value: "Simpasai zawali", label: "Simpasai zawali" },
];

const unitOptions = [
    { value: "KG", label: "KG" },
    { value: "g", label: "g" },
    { value: "count", label: "count" },
];

interface CollectionFormProps {
    collection?: SeedCollectionI;
    onSubmit: (data: Omit<SeedCollectionI, "id">) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function CollectionForm({
    collection,
    onSubmit,
    onCancel,
    loading = false,
}: CollectionFormProps) {
    const [formData, setFormData] = useState({
        species: collection?.species || "",
        quantity: collection?.quantity?.toString() || "",
        unit: (collection?.unit?.toUpperCase() as "KG" | "g" | "count") || "KG",
        motherTree: collection?.motherTree || "",
        additionalInfo: collection?.additionalInfo || "",
        latitude: collection?.latitude?.toString() || "",
        longitude: collection?.longitude?.toString() || "",
    });
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const validateFile = (file: File): string | null => {
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            return "Invalid file type. Please upload JPG, PNG, or HEIC files only.";
        }

        if (file.size > maxSize) {
            return "File size exceeds 10MB limit.";
        }

        return null;
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newFiles: File[] = [];
        const newPreviewUrls: string[] = [];

        Array.from(files).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                console.error(error);
                return;
            }

            newFiles.push(file);
            const url = URL.createObjectURL(file);
            newPreviewUrls.push(url);
        });

        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setLocationLoading(true);
        setLocationError(null);

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData({
                    ...formData,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6),
                });
                setLocationLoading(false);
                setLocationError(null);
            },
            (error) => {
                setLocationLoading(false);
                let errorMessage = "Failed to get location";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred while getting location.";
                        break;
                }

                setLocationError(errorMessage);
                console.error("Geolocation error:", error);
            },
            options
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            species: formData.species,
            motherTree: formData.motherTree,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit.toLowerCase() as "kg" | "g" | "count",
            additionalInfo: formData.additionalInfo,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h2 className="text-h5 mb-4">Collection Details</h2>
                <p className="text-caption mb-6">
                    Provide accurate information about the seeds collected
                </p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-label mb-2">Species</label>
                        <CustomSelect
                            name="species"
                            value={formData.species}
                            onChange={(value) => handleSelectChange("species", value)}
                            options={speciesOptions}
                            placeholder="Select native species"
                            required
                        />
                        <p className="text-caption mt-1 opacity-75">
                            Select the native species of the seeds collected
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label mb-2">Quantity</label>
                            <Input
                                name="quantity"
                                type="number"
                                placeholder="Enter amount"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                            <p className="text-caption mt-1 opacity-75">
                                Enter the total quantity collected
                            </p>
                        </div>
                        <div>
                            <label className="block text-label mb-2">Unit</label>
                            <CustomSelect
                                name="unit"
                                value={formData.unit}
                                onChange={(value) => handleSelectChange("unit", value)}
                                options={unitOptions}
                                required
                            />
                            <p className="text-caption mt-1 opacity-75">
                                Select the measurement unit
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-label mb-2">Mother tree</label>
                        <CustomSelect
                            name="motherTree"
                            value={formData.motherTree}
                            onChange={(value) => handleSelectChange("motherTree", value)}
                            options={speciesOptions}
                            placeholder="Select native species"
                            required
                        />
                        <p className="text-caption mt-1 opacity-75">
                            Select the species of the mother tree
                        </p>
                    </div>

                    <div>
                        <label className="block text-label mb-2">
                            Additional information
                        </label>
                        <Textarea
                            name="additionalInfo"
                            placeholder="Any additional suppliments"
                            value={formData.additionalInfo}
                            onChange={handleChange}
                            rows={4}
                        />
                        <p className="text-caption mt-1 opacity-75">
                            Optional: Add any additional notes or observations
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-h5 mb-4">Photo Evidence</h2>
                <p className="text-caption mb-6">
                    Upload photos of the mother tree and seed batch
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {previewUrls.length === 0 ? (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-12 text-center bg-pale transition-colors",
                            dragActive
                                ? "border-primary bg-primary/5"
                                : "border-[var(--very-dark-color)]/10"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Camera size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-caption mb-4">
                            Click to upload or drag and drop photos
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-primary text-white hover:bg-primary-dark"
                            onClick={openFileDialog}
                        >
                            <Upload size={16} className="mr-2" />
                            SELECT PHOTOS
                        </Button>
                        <p className="text-caption mt-4 opacity-75">
                            Upload JPG, PNG, or HEIC files (max 10MB per file)
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <AnimatePresence>
                                {previewUrls.map((url, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        className="relative group aspect-square rounded-lg overflow-hidden bg-pale border border-[var(--very-dark-color)]/10"
                                    >
                                        <Image
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={16} className="text-white" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-caption text-white truncate">
                                                {selectedFiles[index]?.name}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center bg-pale transition-colors",
                                dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-[var(--very-dark-color)]/10"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-primary text-white hover:bg-primary-dark"
                                onClick={openFileDialog}
                            >
                                <Upload size={16} className="mr-2" />
                                ADD MORE PHOTOS
                            </Button>
                            <p className="text-caption mt-2 opacity-75">
                                {selectedFiles.length} photo{selectedFiles.length !== 1 ? "s" : ""} selected
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-h5 mb-4">GPS Location</h2>
                <p className="text-caption mb-6">
                    Capture exact collection coordinates
                </p>

                <div className="space-y-4">
                    <Button
                        type="button"
                        onClick={handleGetLocation}
                        variant="outline"
                        className="bg-[var(--very-dark-color)] rounded-full text-white hover:bg-[var(--very-dark-color)]/90"
                        disabled={locationLoading}
                    >
                        <PinIcon />
                        {locationLoading ? "Getting Location..." : "Get Location"}
                    </Button>

                    {locationError && (
                        <p className="text-caption text-[var(--very-dark-color)] opacity-75">
                            {locationError}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label mb-2">Latitude</label>
                            <Input
                                name="latitude"
                                type="number"
                                step="any"
                                placeholder="Enter latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                            />
                            <p className="text-caption mt-1 opacity-75">
                                Decimal degrees format
                            </p>
                        </div>
                        <div>
                            <label className="block text-label mb-2">Longitude</label>
                            <Input
                                name="longitude"
                                type="number"
                                step="any"
                                placeholder="Enter longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                            />
                            <p className="text-caption mt-1 opacity-75">
                                Decimal degrees format
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                    disabled={loading}
                >
                    {loading ? "Submitting..." : collection ? "Update" : "Submit"}
                </Button>
            </div>
        </form>
    );
}

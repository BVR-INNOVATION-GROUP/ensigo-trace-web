"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, MapPin, Calendar, Building2, Loader2, Search, Crosshair } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";
import { AddressAutocomplete, RegionDistrictSelect, reverseGeocode, getCurrentLocationWithAddress, formatCoordinates, type GeoSearchResult } from "@/components/geo";
import type { SeedCollectionI, Nursery } from "@/src/models/SeedCollection";
import type { Species } from "@/src/models/User";
import { useSpecies } from "@/src/hooks/useSpecies";
import { useNurseries } from "@/src/hooks/useNurseries";
import api from "@/src/api/client";

// Dynamic import for map
const LocationMap = dynamic(() => import("@/components/geo/location-map"), {
    ssr: false,
    loading: () => (
        <div className="h-full bg-pale flex items-center justify-center">
            <Loader2 className="animate-spin opacity-40" size={32} />
        </div>
    ),
});

const unitOptions = [
    { value: "kg", label: "KG" },
    { value: "g", label: "g" },
    { value: "count", label: "count" },
];

interface CollectionFormProps {
    collection?: SeedCollectionI;
    onSubmit: (data: Omit<SeedCollectionI, "id"> & { photos?: string[] }) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function CollectionForm({
    collection,
    onSubmit,
    onCancel,
    loading = false,
}: CollectionFormProps) {
    const { species, loading: speciesLoading } = useSpecies();
    const { myNurseries, nurseries, loading: nurseriesLoading } = useNurseries();

    const [formData, setFormData] = useState({
        species: collection?.species || "",
        speciesId: collection?.species_id || "",
        quantity: collection?.quantity?.toString() || "",
        unit: (collection?.unit as "kg" | "g" | "count") || "kg",
        motherTree: collection?.motherTree || "",
        motherTreeId: collection?.mother_tree_id || "",
        additionalInfo: collection?.additionalInfo || "",
        latitude: collection?.latitude?.toString() || "",
        longitude: collection?.longitude?.toString() || "",
        region: collection?.region || "",
        district: collection?.district || "",
        village: collection?.village || "",
        collectionDate: collection?.collection_date || new Date().toISOString().split('T')[0],
        collectionTime: new Date().toTimeString().slice(0, 5),
        targetNurseryId: collection?.target_nursery_id || "",
    });
    // Location state is now handled by LocationPicker component
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Convert species to options
    const speciesOptions = species.map((s: Species) => ({
        value: s.id,
        label: `${s.scientific_name}${s.common_name ? ` (${s.common_name})` : ''}`,
    }));

    // Get available nurseries (prioritize collector's registered nurseries)
    const availableNurseries = myNurseries.length > 0
        ? myNurseries.map(nc => nc.nursery)
        : nurseries;

    const nurseryOptions = availableNurseries.map((n: Nursery) => ({
        value: n.id,
        label: `${n.name} (${n.type})`,
    }));

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === "species") {
            const selectedSpecies = species.find(s => s.id === value);
            setFormData({
                ...formData,
                speciesId: value,
                species: selectedSpecies?.scientific_name || "",
            });
        } else if (name === "targetNurseryId") {
            setFormData({ ...formData, targetNurseryId: value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const validateFile = (file: File): string | null => {
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
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

    const [locationLoading, setLocationLoading] = useState(false);

    // Handle map click
    const handleMapClick = async (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
        }));
        setLocationLoading(true);
        try {
            const location = await reverseGeocode(lat, lng);
            if (location) {
                setFormData(prev => ({
                    ...prev,
                    region: location.region || prev.region,
                    district: location.district || prev.district,
                    village: location.village || prev.village,
                }));
            }
        } catch (err) {
            console.error("Reverse geocode error:", err);
        } finally {
            setLocationLoading(false);
        }
    };

    // Handle GPS location
    const handleGetLocation = async () => {
        setLocationLoading(true);
        try {
            const location = await getCurrentLocationWithAddress();
            if (location) {
                setFormData(prev => ({
                    ...prev,
                    latitude: location.latitude.toFixed(6),
                    longitude: location.longitude.toFixed(6),
                    region: location.region || prev.region,
                    district: location.district || prev.district,
                    village: location.village || prev.village,
                }));
            }
        } catch (err) {
            console.error("Get location error:", err);
        } finally {
            setLocationLoading(false);
        }
    };

    // Handle search result selection
    const handleSearchSelect = (result: GeoSearchResult) => {
        setFormData(prev => ({
            ...prev,
            latitude: result.latitude.toFixed(6),
            longitude: result.longitude.toFixed(6),
            region: result.address.region || result.address.state || prev.region,
            district: result.address.district || result.address.county || prev.district,
            village: result.address.village || result.address.town || prev.village,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let photoUrls: string[] = [];

        // Upload photos first
        if (selectedFiles.length > 0) {
            setUploadingPhotos(true);
            try {
                const result = await api.uploadMultiple(selectedFiles, "collections");
                photoUrls = result.files?.map((f: { url: string }) => f.url) || [];
            } catch (err) {
                console.error("Error uploading photos:", err);
                // Continue without photos if upload fails
            }
            setUploadingPhotos(false);
        }

        // Combine date and time
        const collectionDateTime = `${formData.collectionDate}T${formData.collectionTime}:00`;

        await onSubmit({
            species: formData.species,
            species_id: formData.speciesId || undefined,
            motherTree: formData.motherTree,
            mother_tree_id: formData.motherTreeId || undefined,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            additionalInfo: formData.additionalInfo,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
            region: formData.region || undefined,
            district: formData.district || undefined,
            village: formData.village || undefined,
            collection_date: collectionDateTime,
            target_nursery_id: formData.targetNurseryId || undefined,
            photos: photoUrls.length > 0 ? photoUrls : undefined,
        });
    };

    // Find selected nursery for display
    const selectedNursery = availableNurseries.find(n => n.id === formData.targetNurseryId);

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                {/* Left Column - Map & Location */}
                <div className="bg-pale p-8 flex flex-col border-r border-[var(--very-dark-color)]/10 overflow-y-auto scrollbar-thin">
                    <h3 className="text-h5 mb-6 flex items-center gap-2">
                        <MapPin size={20} />
                        Collection Location
                    </h3>

                    {/* Search */}
                    <div className="mb-6">
                        <label className="block text-label mb-3">
                            <Search size={14} className="inline mr-1" />
                            Search Location
                        </label>
                        <AddressAutocomplete
                            placeholder="Search for a place in Uganda..."
                            onSelect={handleSearchSelect}
                        />
                    </div>

                    {/* GPS Button */}
                    <div className="mb-6 flex items-center gap-4">
                        <Button
                            type="button"
                            onClick={handleGetLocation}
                            variant="pale"
                            className="bg-[var(--very-dark-color)] rounded-full text-white hover:bg-[var(--very-dark-color)]/90"
                            disabled={locationLoading}
                        >
                            {locationLoading ? (
                                <Loader2 size={16} className="animate-spin mr-2" />
                            ) : (
                                <Crosshair size={16} className="mr-2" />
                            )}
                            Use My Location
                        </Button>
                        {formData.latitude && formData.longitude && (
                            <span className="text-caption opacity-70">
                                {formatCoordinates(parseFloat(formData.latitude), parseFloat(formData.longitude))}
                            </span>
                        )}
                    </div>

                    {/* Map */}
                    <div className="flex-1 min-h-[280px] rounded-lg overflow-hidden border border-[var(--very-dark-color)]/10">
                        <LocationMap
                            latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                            longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                            onMapClick={handleMapClick}
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-label mb-3">Latitude</label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="e.g., 3.0339"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-label mb-3">Longitude</label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="e.g., 30.9107"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Administrative Location */}
                    <div className="mt-6">
                        <label className="block text-label mb-3">Administrative Location</label>
                        <RegionDistrictSelect
                            region={formData.region}
                            district={formData.district}
                            village={formData.village}
                            onRegionChange={(value) => setFormData({ ...formData, region: value })}
                            onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                            onVillageChange={(value) => setFormData({ ...formData, village: value })}
                            showVillage={true}
                            layout="vertical"
                        />
                    </div>
                </div>

                {/* Right Column - Form Details */}
                <div className="bg-paper p-8 overflow-y-auto scrollbar-thin">
                    <h3 className="text-h5 mb-6">Collection Details</h3>

                    <div className="space-y-6">
                        {/* Species */}
                        <div>
                            <label className="block text-label mb-3">Species *</label>
                            <CustomSelect
                                name="species"
                                value={formData.speciesId}
                                onChange={(value) => handleSelectChange("species", value)}
                                options={speciesOptions}
                                placeholder={speciesLoading ? "Loading species..." : "Select native species"}
                                required
                                disabled={speciesLoading}
                            />
                        </div>

                        {/* Quantity & Unit */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-label mb-3">Quantity *</label>
                                <Input
                                    name="quantity"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-label mb-3">Unit *</label>
                                <CustomSelect
                                    name="unit"
                                    value={formData.unit}
                                    onChange={(value) => handleSelectChange("unit", value)}
                                    options={unitOptions}
                                    required
                                />
                            </div>
                        </div>

                        {/* Mother Tree */}
                        <div>
                            <label className="block text-label mb-3">Mother Tree *</label>
                            <CustomSelect
                                name="motherTree"
                                value={formData.speciesId}
                                onChange={(value) => handleSelectChange("motherTree", value)}
                                options={speciesOptions}
                                placeholder="Select species of mother tree"
                                required
                                disabled={speciesLoading}
                            />
                        </div>

                        {/* Date & Time */}
                        <div>
                            <label className="flex items-center gap-2 text-label mb-3">
                                <Calendar size={16} />
                                Collection Date & Time
                            </label>
                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    name="collectionDate"
                                    type="date"
                                    value={formData.collectionDate}
                                    onChange={handleChange}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                <Input
                                    name="collectionTime"
                                    type="time"
                                    value={formData.collectionTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Target Nursery */}
                        <div>
                            <label className="flex items-center gap-2 text-label mb-3">
                                <Building2 size={16} />
                                Submitting To
                            </label>
                            <CustomSelect
                                name="targetNurseryId"
                                value={formData.targetNurseryId}
                                onChange={(value) => handleSelectChange("targetNurseryId", value)}
                                options={nurseryOptions}
                                placeholder={nurseriesLoading ? "Loading nurseries..." : "Select target nursery"}
                                disabled={nurseriesLoading}
                            />
                            {selectedNursery && (
                                <div className="mt-4 p-4 bg-pale rounded-lg border border-[var(--very-dark-color)]/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{selectedNursery.name}</p>
                                            <p className="text-caption opacity-70">
                                                {selectedNursery.type === "regional" && "Regional"}
                                                {selectedNursery.type === "super" && "Super"}
                                                {selectedNursery.type === "community" && "Community"}
                                                {selectedNursery.location && ` • ${selectedNursery.location}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div>
                            <label className="block text-label mb-3">Additional Information</label>
                            <Textarea
                                name="additionalInfo"
                                placeholder="Any additional notes or observations"
                                value={formData.additionalInfo}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        {/* Photo Evidence */}
                        <div>
                            <label className="block text-label mb-3">Photo Evidence</label>
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
                                        "border-2 border-dashed rounded-lg p-8 text-center bg-pale transition-colors",
                                        dragActive ? "border-primary bg-primary/5" : "border-[var(--very-dark-color)]/10"
                                    )}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <Camera size={36} className="mx-auto mb-3 opacity-40" />
                                    <p className="text-body-sm mb-4 opacity-70">
                                        Upload photos of mother tree & seeds
                                    </p>
                                    <Button
                                        type="button"
                                        variant="pale"
                                        className="bg-primary text-white hover:bg-primary-dark"
                                        onClick={openFileDialog}
                                    >
                                        <Upload size={16} className="mr-2" />
                                        Select Photos
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-3">
                                        <AnimatePresence>
                                            {previewUrls.map((url, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="relative group aspect-square rounded-lg overflow-hidden bg-pale border border-[var(--very-dark-color)]/10"
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="100px"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={14} className="text-white" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="pale"
                                        onClick={openFileDialog}
                                    >
                                        <Upload size={16} className="mr-2" />
                                        Add More ({selectedFiles.length} selected)
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 p-6 border-t border-[var(--very-dark-color)]/10 bg-paper">
                <Button type="button" variant="pale" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                    disabled={loading || uploadingPhotos}
                >
                    {uploadingPhotos ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : loading ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        collection ? "Update Collection" : "Submit Collection"
                    )}
                </Button>
            </div>
        </form>
    );
}

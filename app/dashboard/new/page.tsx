"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SeedCollectionService } from "@/src/services/SeedCollection";

const speciesOptions = [
  "Albizia coriaria",
  "Ariaewal zink",
  "Simpasai zawali",
  "Select native species",
];

const unitOptions = ["KG", "g", "count"];

export default function NewCollectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    species: "",
    quantity: "",
    unit: "KG",
    motherTree: "",
    additionalInfo: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const seedService = new SeedCollectionService();
      await seedService.addCollection({
        species: formData.species,
        motherTree: formData.motherTree,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.toLowerCase() as "kg" | "g" | "count",
        additionalInfo: formData.additionalInfo,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-body mb-2 font-bold">
          New Seed Collection
        </h1>
        <p className="text-body mb-8">
          Record a new seed collection batch for verification
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-body mb-4 font-semibold">
              Collection Details
            </h2>
            <p className="text-body-sm mb-6">
              Provide accurate information about the seeds collected
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-label mb-2">
                  Species
                </label>
                <Select
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select native species</option>
                  {speciesOptions
                    .filter((s) => s !== "Select native species")
                    .map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label mb-2">
                    Quantity
                  </label>
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
                  <label className="block text-label mb-2">
                    Unit
                  </label>
                  <Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-label mb-2">
                  Mother tree
                </label>
                <Select
                  name="motherTree"
                  value={formData.motherTree}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select native species</option>
                  {speciesOptions
                    .filter((s) => s !== "Select native species")
                    .map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="col-span-2">
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
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-body mb-4 font-semibold">
              Photo Evidence
            </h2>
            <p className="text-body-sm mb-6">
              Upload photos of the mother tree and seed batch
            </p>

            <div className="border-2 border-dashed border-pale rounded-lg p-12 text-center bg-pale">
              <Camera size={48} className="mx-auto mb-4" />
              <p className="text-body-sm mb-4">
                Click to upload or drag and drop photos
              </p>
              <Button type="button" variant="outline" className="bg-primary text-white hover:bg-primary-dark">
                <Upload size={16} className="mr-2" />
                SELECT PHOTOS
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-body mb-4 font-semibold">
              GPS Location
            </h2>
            <p className="text-body-sm mb-6">
              Capture exact collection coordinates
            </p>

            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleGetLocation}
                variant="outline"
                className="bg-[var(--very-dark-color)] text-white hover:bg-[var(--very-dark-color)]/90"
              >
                GET LOCATION
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label mb-2">
                    Latitude
                  </label>
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-label mb-2">
                    Longitude
                  </label>
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white"
            disabled={loading}
          >
            {loading ? "Submitting..." : "SUBMIT"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}


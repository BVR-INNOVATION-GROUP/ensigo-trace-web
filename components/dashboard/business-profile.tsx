"use client";

import { useState } from "react";
import {
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit,
  Camera,
  Save,
  X,
  CheckCircle,
  Leaf,
  Plus,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User as UserType } from "@/src/models/User";
import api from "@/src/api/client";

interface BusinessProfileProps {
  user: UserType;
  onUpdate?: (user: UserType) => void;
  editable?: boolean;
}

export function BusinessProfile({
  user,
  onUpdate,
  editable = true,
}: BusinessProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    business_name: user.business_name || "",
    business_description: user.business_description || "",
    bio: user.bio || "",
    address: user.address || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await api.updateProfile(formData);
      onUpdate?.(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      business_name: user.business_name || "",
      business_description: user.business_description || "",
      bio: user.bio || "",
      address: user.address || "",
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "logo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const result = await api.uploadFile(file, "profiles");
      const field = type === "profile" ? "profile_photo" : "business_logo";
      const updatedUser = await api.updateProfile({ [field]: result.url });
      onUpdate?.(updatedUser);
    } catch (err) {
      console.error("Error uploading photo:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-xl overflow-hidden">
      {/* Header/Cover */}
      <div className="h-36 relative">
        <Image
          src="https://images.pexels.com/photos/33596970/pexels-photo-33596970.jpeg"
          alt="Profile cover"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70" />
        {editable && !isEditing && (
          <Button
            size="sm"
            variant="pale"
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:text-white"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={14} className="mr-1.5" />
            Edit Profile
          </Button>
        )}
        {isEditing && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="pale"
              className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:text-white"
              onClick={handleCancel}
            >
              <X size={14} className="mr-1.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-2xl border-2 border-[var(--card)] bg-pale overflow-hidden relative shadow-lg">
              {user.profile_photo ? (
                <Image
                  src={user.profile_photo}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-4xl font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, "profile")}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
            </div>
            {user.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-[var(--card)] rounded-full p-0.5 shadow-sm">
                <div className="bg-primary rounded-full p-1">
                  <CheckCircle size={14} className="text-white" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 pt-2 sm:pt-8">
            {!isEditing && (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-[var(--very-dark-color)]">
                    {user.name}
                  </h2>
                  {user.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      <CheckCircle size={10} />
                      Verified
                    </span>
                  )}
                </div>
                {user.business_name && (
                  <p className="text-primary font-medium text-sm">
                    {user.business_name}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Business ID Badge - Desktop */}
          {!isEditing && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-pale rounded-lg">
              <Building2 size={16} className="text-primary" />
              <span className="font-mono text-sm font-medium text-[var(--very-dark-color)]">
                {user.business_id}
              </span>
            </div>
          )}
        </div>

        {/* Business ID Badge - Mobile */}
        {!isEditing && (
          <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-pale rounded-lg mb-4 w-fit">
            <Building2 size={16} className="text-primary" />
            <span className="font-mono text-sm font-medium text-[var(--very-dark-color)]">
              {user.business_id}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                  Full Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                  Phone Number
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+256 xxx xxx xxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                Business Name
              </label>
              <Input
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                Business Description
              </label>
              <Textarea
                name="business_description"
                value={formData.business_description}
                onChange={handleChange}
                placeholder="Describe your seed collection business, services, and expertise..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                Bio
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="A short personal bio..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--very-dark-color)] mb-1.5">
                Address / Location
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Village, District, Region"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                loading={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                variant="pale"
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Description */}
            {user.business_description && (
              <div className="bg-pale/50 rounded-lg p-4">
                <p className="text-sm text-[var(--very-dark-color)]/80 leading-relaxed">
                  {user.business_description}
                </p>
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="text-sm italic text-[var(--very-dark-color)]/60 border-l-2 border-primary/30 pl-4">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-pale/50 rounded-lg">
                <div className="w-9 h-9 rounded-lg bg-[var(--card)] flex items-center justify-center shadow-sm">
                  <Mail size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--very-dark-color)]/50">Email</p>
                  <p className="text-sm font-medium text-[var(--very-dark-color)] truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3 p-3 bg-pale/50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[var(--card)] flex items-center justify-center shadow-sm">
                    <Phone size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--very-dark-color)]/50">Phone</p>
                    <p className="text-sm font-medium text-[var(--very-dark-color)]">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}

              {(user.address || user.region) && (
                <div className="flex items-center gap-3 p-3 bg-pale/50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[var(--card)] flex items-center justify-center shadow-sm">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--very-dark-color)]/50">Location</p>
                    <p className="text-sm font-medium text-[var(--very-dark-color)]">
                      {user.address || user.region}
                    </p>
                  </div>
                </div>
              )}

              {user.region && user.address && (
                <div className="flex items-center gap-3 p-3 bg-pale/50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[var(--card)] flex items-center justify-center shadow-sm">
                    <Globe size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--very-dark-color)]/50">Region</p>
                    <p className="text-sm font-medium text-[var(--very-dark-color)]">
                      {user.region}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Species Catalogue */}
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-[var(--very-dark-color)] mb-3 flex items-center gap-2">
                <Leaf size={16} className="text-primary" />
                Species Catalogue
              </h3>

              {user.catalogue && user.catalogue.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.catalogue.map((item) => (
                    <div
                      key={item.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        item.is_available
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-pale text-[var(--very-dark-color)]/50"
                      }`}
                    >
                      <Leaf size={12} />
                      {item.species.scientific_name}
                      {!item.is_available && (
                        <span className="text-[10px] opacity-60">(unavailable)</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-pale/50 rounded-lg text-sm text-[var(--very-dark-color)]/50">
                  <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center">
                    <Plus size={20} className="text-[var(--very-dark-color)]/30" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--very-dark-color)]/70">No species in catalogue</p>
                    <p className="text-xs">Add species you collect to help nurseries find you</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessProfile;

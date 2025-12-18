"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useUser } from "@/src/hooks/useUser";

export default function ProfilePage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      // Split name into first and last
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setFormData({
        firstName,
        lastName,
        email: user.email || "",
        phone: "", // Not stored in user object
        location: user.region || "",
        bio: "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    // Handle save logic here
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-h4 mb-2">Profile</h1>
        <p className="text-body-sm mb-8">
          Manage your personal information and preferences
        </p>

        <div className="bg-paper rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-[var(--very-dark-color)]/10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-pale">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"
                  alt="Profile"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Camera size={16} />
              </button>
            </div>
            <div>
              <h2 className="text-h5 mb-1">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-caption opacity-75">{formData.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-label mb-2">First Name</label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-label mb-2">Last Name</label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-label mb-2">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
              <p className="text-caption mt-1 opacity-75">
                Your email address cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-label mb-2">Phone Number</label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-label mb-2">Location</label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-label mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-[var(--very-dark-color)]/10 bg-paper px-3 py-2 text-body placeholder:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-caption mt-1 opacity-75">
                Tell us a little about yourself
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-[var(--very-dark-color)]/10">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary-dark text-white"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/src/hooks/useUser";

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (user) {
      // Split name into first and last
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setProfileData({
        firstName,
        lastName,
        phone: "", // Not stored in user object
        location: user.region || "",
      });
    }
  }, [user]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    // Handle password change
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-h4 mb-2">Settings</h1>
        <p className="text-body-sm mb-8">
          Manage your account settings and preferences
        </p>

        <div className="bg-paper rounded-lg overflow-hidden">
          <div className="flex border-b border-[var(--very-dark-color)]/10">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile"
                ? "px-6 py-4 text-body font-medium border-b-2 border-primary text-primary"
                : "px-6 py-4 text-body opacity-75 hover:opacity-100"}
            >
              Profile Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={activeTab === "password"
                ? "px-6 py-4 text-body font-medium border-b-2 border-primary text-primary"
                : "px-6 py-4 text-body opacity-75 hover:opacity-100"}
            >
              Change Password
            </button>
          </div>

          <div className="p-6">
            {activeTab === "profile" ? (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label mb-2">First Name</label>
                    <Input
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div>
                    <label className="block text-label mb-2">Last Name</label>
                    <Input
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label mb-2">Phone Number</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                  <p className="text-caption mt-1 opacity-75">
                    Update your contact phone number
                  </p>
                </div>

                <div>
                  <label className="block text-label mb-2">Location</label>
                  <Input
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                  />
                  <p className="text-caption mt-1 opacity-75">
                    Your current location
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-[var(--very-dark-color)]/10">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-label mb-2">Current Password</label>
                  <Input
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <p className="text-caption mt-1 opacity-75">
                    Enter your current password to verify
                  </p>
                </div>

                <div>
                  <label className="block text-label mb-2">New Password</label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <p className="text-caption mt-1 opacity-75">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-label mb-2">Confirm New Password</label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <p className="text-caption mt-1 opacity-75">
                    Re-enter your new password
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-[var(--very-dark-color)]/10">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

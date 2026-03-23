"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Phone, User, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import {
  RegionalNurseryFormGrid,
  emptyRegionalNurseryForm,
  type RegionalNurseryFormState,
} from "@/components/nursery/regional-nursery-form-grid";
import {
  reverseGeocode,
  getCurrentLocationWithAddress,
  formatCoordinates,
  type GeoSearchResult,
} from "@/components/geo";
import { AuthService } from "@/src/services/AuthService";

interface RegionalSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const titles = ["Create account", "Your regional nursery", "Review and submit"];

/** Step 2 needs the wide map + details grid; steps 1 and 3 match a single-column form width. */
function modalSizeForStep(step: number): "md" | "full" {
  return step === 2 ? "full" : "md";
}

export function RegionalSignupModal({ isOpen, onClose }: RegionalSignupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nurseryForm, setNurseryForm] = useState<RegionalNurseryFormState>(() => emptyRegionalNurseryForm());
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setConfirmPassword("");
    setNurseryForm(emptyRegionalNurseryForm());
    setError(null);
    setLoading(false);
    setLocationLoading(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setNurseryForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(2),
      longitude: lng.toFixed(2),
    }));
    setLocationLoading(true);
    try {
      const location = await reverseGeocode(lat, lng);
      if (location) {
        setNurseryForm((prev) => ({
          ...prev,
          region: location.region || prev.region,
          district: location.district || prev.district,
          location: location.village || location.displayName?.split(",")[0] || prev.location,
        }));
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocationWithAddress();
      if (location) {
        setNurseryForm((prev) => ({
          ...prev,
          latitude: location.latitude.toFixed(2),
          longitude: location.longitude.toFixed(2),
          region: location.region || prev.region,
          district: location.district || prev.district,
          location: location.village || prev.location,
        }));
      }
    } catch (err) {
      console.error("Get location error:", err);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearchSelect = (result: GeoSearchResult) => {
    setNurseryForm((prev) => ({
      ...prev,
      latitude: result.latitude.toFixed(2),
      longitude: result.longitude.toFixed(2),
      region: result.address.region || result.address.state || prev.region,
      district: result.address.district || result.address.county || prev.district,
      location: result.address.village || result.address.town || prev.location,
    }));
  };

  const validateStep1 = () => {
    if (!name.trim()) return "Your name is required";
    if (!email.trim()) return "Email is required";
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const validateStep2 = () => {
    if (!nurseryForm.name.trim()) return "Organisation or nursery name is required";
    if (!nurseryForm.region.trim()) return "Region is required";
    if (!nurseryForm.district.trim()) return "District is required";
    const cap = parseInt(nurseryForm.capacity, 10);
    if (!nurseryForm.capacity.trim() || Number.isNaN(cap) || cap < 1) {
      return "Valid capacity (seedlings) is required";
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const m = validateStep1();
      if (m) {
        setError(m);
        return;
      }
    }
    if (step === 2) {
      const m = validateStep2();
      if (m) {
        setError(m);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError(null);
    const m = validateStep1() || validateStep2();
    if (m) {
      setError(m);
      return;
    }
    setLoading(true);
    try {
      const authService = new AuthService();
      const latStr = nurseryForm.latitude.trim();
      const lngStr = nurseryForm.longitude.trim();
      const lat = latStr ? parseFloat(latStr) : undefined;
      const lng = lngStr ? parseFloat(lngStr) : undefined;
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        region: nurseryForm.region,
        district: nurseryForm.district,
        location: nurseryForm.location.trim() || undefined,
        latitude: lat !== undefined && !Number.isNaN(lat) ? lat : undefined,
        longitude: lng !== undefined && !Number.isNaN(lng) ? lng : undefined,
        capacity: parseInt(nurseryForm.capacity, 10),
        business_name: nurseryForm.name.trim(),
        business_description: nurseryForm.description.trim() || undefined,
        role: "regional_nursery",
      });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      handleClose();
      router.push("/onboarding/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={titles[step - 1]} size={modalSizeForStep(step)}>
      <div className="flex flex-col flex-1 min-h-0">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 rounded-lg shrink-0">
            <p className="text-body-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {step === 1 && (
            <div className="p-6 sm:p-8 overflow-y-auto w-full space-y-6">
              <p className="text-body-sm text-[var(--very-dark-color)]/70">
                Register as a regional nursery operator. An admin will verify your site before full access.
              </p>
              <div>
                <label className="block text-label mb-2 text-[var(--very-dark-color)]">Your full name</label>
                <AuthInput
                  type="text"
                  placeholder="Name as it should appear on the account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  icon={<User size={18} />}
                />
              </div>
              <div>
                <label className="block text-label mb-2 text-[var(--very-dark-color)]">Email</label>
                <AuthInput
                  type="email"
                  placeholder="you@organisation.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<Mail size={18} />}
                />
              </div>
              <div>
                <label className="block text-label mb-2 text-[var(--very-dark-color)]">Phone (optional)</label>
                <AuthInput
                  type="tel"
                  placeholder="+256…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone size={18} />}
                />
              </div>
              <div>
                <label className="block text-label mb-2 text-[var(--very-dark-color)]">Password</label>
                <AuthInput
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={<Lock size={18} />}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--placeholder)] hover:text-[var(--very-dark-color)] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>
              <div>
                <label className="block text-label mb-2 text-[var(--very-dark-color)]">Confirm password</label>
                <AuthInput
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={<Lock size={18} />}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[var(--placeholder)] hover:text-[var(--very-dark-color)] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <RegionalNurseryFormGrid
              formData={nurseryForm}
              setFormData={setNurseryForm}
              locationLoading={locationLoading}
              onSearchSelect={handleSearchSelect}
              onMapClick={handleMapClick}
              onGetLocation={handleGetLocation}
              nameLabel="Organisation / nursery name"
              namePlaceholder="Official nursery or organisation name"
              showContactFields={false}
            />
          )}

          {step === 3 && (
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 w-full">
              <dl className="space-y-4 text-[var(--very-dark-color)]">
                <div>
                  <dt className="text-caption opacity-70">Account</dt>
                  <dd className="text-body font-medium">{name}</dd>
                  <dd className="text-body-sm opacity-80">{email}</dd>
                  {phone ? <dd className="text-body-sm opacity-80">{phone}</dd> : null}
                </div>
                <div>
                  <dt className="text-caption opacity-70">Organisation</dt>
                  <dd className="text-body font-medium">{nurseryForm.name}</dd>
                  {nurseryForm.description ? (
                    <dd className="text-body-sm opacity-80 mt-1">{nurseryForm.description}</dd>
                  ) : null}
                </div>
                <div>
                  <dt className="text-caption opacity-70">Location</dt>
                  <dd className="text-body-sm">
                    {nurseryForm.region}
                    {nurseryForm.district ? ` · ${nurseryForm.district}` : ""}
                  </dd>
                  {nurseryForm.location ? (
                    <dd className="text-body-sm opacity-80">{nurseryForm.location}</dd>
                  ) : null}
                  {nurseryForm.latitude && nurseryForm.longitude ? (
                    <dd className="text-caption opacity-70 mt-1">
                      {formatCoordinates(parseFloat(nurseryForm.latitude), parseFloat(nurseryForm.longitude))}
                    </dd>
                  ) : null}
                </div>
                <div>
                  <dt className="text-caption opacity-70">Capacity</dt>
                  <dd className="text-body font-medium">{nurseryForm.capacity} seedlings</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4 p-6 border-t border-[var(--border)] bg-paper shrink-0">
          <Button type="button" variant="pale" onClick={step === 1 ? handleClose : handleBack} disabled={loading}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="button" loading={loading} onClick={() => void handleSubmit()}>
              Create account
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Phone, Building2, MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthService } from "@/src/services/AuthService";
import type { RegisterData } from "@/src/models/User";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    region: "",
    business_name: "",
    business_description: "",
    role: "regional_nursery",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof RegisterData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!form.password.trim()) {
      setError("Password is required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!form.business_name?.trim()) {
      setError("Nursery or organisation name is required");
      return;
    }

    setLoading(true);
    try {
      const authService = new AuthService();
      const response = await authService.register({
        ...form,
        role: "regional_nursery",
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Newly registered regional nurseries should see the pending verification view first
      router.push("/onboarding/pending");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side – Story & Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div>
                <p className="text-h1 font-impact tracking-tight">
                  ENSIGO <span className="text-white">TRACE</span>
                </p>
                <p className="opacity-90 text-body-sm">
                  Building Africa&apos;s native seed network
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-lg"
          >
            <h1 className="text-h2 mb-4">
              Join the regional nursery network
            </h1>
            <p className="text-body-lg opacity-90 leading-relaxed">
              Register your regional nursery to receive verified seed stock,
              track collections from mother trees, and connect with community
              nurseries and collectors in your landscape.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-md"
          >
            <p className="text-body-sm opacity-80">
              Powered by bvr.africa · EnsigoTrace pilot in West Nile, Uganda
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side – Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-pale p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="text-xl">🌱</span>
            </div>
            <div>
              <p className="text-h4 font-impact">
                ENSIGO <span className="text-primary">TRACE</span>
              </p>
              <p className="text-caption opacity-75">
                Regional nursery onboarding
              </p>
            </div>
          </div>

          <div className="bg-paper rounded-2xl shadow-custom p-8 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <h2 className="text-h4 mb-2">Create your regional nursery account</h2>
              <p className="text-body-sm mb-6 opacity-75">
                Tell us about your organisation. A super admin will verify your
                details before you get full access.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-body-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-label mb-2">Full name</label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange("name")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">Work email</label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                    />
                    <Input
                      type="email"
                      placeholder="you@organisation.org"
                      value={form.email}
                      onChange={handleChange("email")}
                      required
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label mb-2">Password</label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                      />
                      <Input
                        type="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange("password")}
                        required
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-label mb-2">
                      Confirm password
                    </label>
                    <Input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label mb-2">Phone</label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                      />
                      <Input
                        type="tel"
                        placeholder="+256 700 000000"
                        value={form.phone || ""}
                        onChange={handleChange("phone")}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-label mb-2">Region</label>
                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                      />
                      <Input
                        type="text"
                        placeholder="e.g. West Nile, Uganda"
                        value={form.region || ""}
                        onChange={handleChange("region")}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-label mb-2">
                    Nursery / organisation name
                  </label>
                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                    />
                    <Input
                      type="text"
                      placeholder="Registered nursery name"
                      value={form.business_name || ""}
                      onChange={handleChange("business_name")}
                      required
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label mb-2">
                    What does your nursery do?
                  </label>
                  <textarea
                    className="w-full border-0 border-b border-[var(--very-dark-color)]/20 bg-transparent px-0 py-2.5 text-body resize-none focus:outline-none focus:border-[var(--very-dark-color)]/40 placeholder:text-[var(--very-dark-color)]/40"
                    rows={3}
                    placeholder="Share a short description of your focus species, production scale, and communities you serve."
                    value={form.business_description || ""}
                    onChange={handleChange("business_description")}
                  />
                </div>

                <div className="flex items-start gap-2 text-caption text-[var(--very-dark-color)]/70">
                  <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
                  <p>
                    By signing up, you&apos;re requesting access as a{" "}
                    <span className="font-medium">regional nursery admin</span>.
                    A super admin will review your details and confirm your
                    account.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-white"
                  loading={loading}
                >
                  Request regional nursery access
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-[var(--very-dark-color)]/10">
                <p className="text-center text-caption">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-caption mt-6 opacity-75">
            All rights reserved to bvr.africa
          </p>
        </motion.div>
      </div>
    </div>
  );
}


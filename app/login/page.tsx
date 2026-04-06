"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { AuthService } from "@/src/services/AuthService";
import Link from "next/link";
import { RegionalSignupModal } from "@/components/auth/regional-signup-modal";
import { ThemeToggle } from "@/components/theme";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("signup") === "1") {
      setSignupOpen(true);
    }
  }, [searchParams]);

  const closeSignup = () => {
    setSignupOpen(false);
    router.replace("/login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authService = new AuthService();
      const response = await authService.login({ email, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      const role = response.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "collector") router.push("/dashboard");
      else if (role === "super_nursery" || role === "community_nursery" || role === "regional_nursery")
        router.push("/nursery");
      else if (role === "partner") router.push("/partner");
      else router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <RegionalSignupModal isOpen={signupOpen} onClose={closeSignup} />
      <div className="fixed top-4 right-4 z-60">
        <ThemeToggle />
      </div>
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/28556567/pexels-photo-28556567.jpeg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div>
                  <p
                    style={{ fontSize: "2rem", lineHeight: "1.1", fontWeight: 900 }}
                    className="leading-tight"
                  >
                    ENSIGO <span className="text-white">TRACE</span>
                  </p>
                  <p className="opacity-90" style={{ fontSize: "1.1rem" }}>
                    Empowering information
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="mb-4 text-white leading-tight max-w-[75%]" style={{ fontSize: "2rem" }}>
                Restoring Biodiversity through Africa&apos;s Native Tree Seed System
              </h1>
              <p className="opacity-90 leading-relaxed max-w-[60%]">
                Millions of trees are planted every year across Africa – yet too few survive. Ensigo Africa is fixing
                that by building a tech-driven native seed network that ensures every tree planted is traceable, viable,
                and ecologically appropriate.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-md"
            >
              <p className="opacity-90 leading-relaxed" style={{ fontSize: "1.05rem" }}>
                powered by bvr.africa &copy; <span>{new Date().getFullYear()}</span>
              </p>
            </motion.div>
          </div>
        </div>

        <div className="w-full flex-1 flex items-center justify-center bg-pale p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className=" min-w-[64%] h-full flex flex-col justify-between"
          >

            <div />

            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                {/* <span className="text-xl">🌳</span> */}
              </div>
              <div>
                <p style={{ fontFamily: "iMPACT" }} className="text-h4">
                  ENSIGO <span className="text-primary">TRACE</span>
                </p>
                <p className="text-caption opacity-75">Empowering information</p>
              </div>
            </div>

            <div className="bg-paper rounded shadow-custom p-8 lg:p-[4rem]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h2 className="text-2xl mb-2 text-(--very-dark-color)">Welcome back</h2>
                <p className="text-body-sm mb-8 text-(--very-dark-color)/75">
                  Sign in to continue to your dashboard
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-body-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-label mb-2 text-[var(--very-dark-color)]">Email address</label>
                    <AuthInput
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      icon={<Mail size={18} />}
                    />
                  </div>

                  <div>
                    <label className="block text-label mb-2 text-[var(--very-dark-color)]">Password</label>
                    <AuthInput
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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

                  <div className="flex items-center justify-between">
                    <div />
                    <Link href="/forgot-password" className="text-caption text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white h-11"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--border)]">
                  <p className="text-center text-caption text-[var(--very-dark-color)]/80">
                    Regional nursery?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        setSignupOpen(true);
                        router.replace("/login");
                      }}
                    >
                      Register your organisation
                    </button>
                  </p>
                </div>
              </motion.div>
            </div>

            <p className="text-center text-caption mt-6 text-[var(--very-dark-color)]/75">
              All rights reserved to bvr.africa
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-pale text-[var(--very-dark-color)]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthService } from "@/src/services/AuthService";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const authService = new AuthService();
            const response = await authService.login({ email, password });
            localStorage.setItem("token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));

            // Redirect based on role
            switch (response.user.role) {
                case "admin":
                    router.push("/admin");
                    break;
                case "collector":
                    router.push("/dashboard");
                    break;
                case "nursery":
                    router.push("/nursery");
                    break;
                case "partner":
                    router.push("/partner");
                    break;
                default:
                    router.push("/dashboard");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden ">
                <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-8">

                            <div>
                                <p style={{ fontFamily: "iMPACT" }} className="text-h1">
                                    ENSIGO <span className="text-white">TRACE</span>
                                </p>
                                <p className="opacity-90">Empowering information</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    // className="max-w-lg"
                    >
                        <h1 className="text-h2 mb-4 text-white">
                            Restoring Biodiversity through Africa's Native Tree Seed System
                        </h1>
                        <p className="text-body-lg opacity-90 leading-relaxed">
                            Millions of trees are planted every year across Africa – yet too few survive. Ensigo Africa is fixing that by building a tech-driven native seed network that ensures every tree planted is traceable, viable, and ecologically appropriate.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-md"
                    >

                        <p className="text-body-lg opacity-90 leading-relaxed">
                            powered by bvr.africa &copy; 2025
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-pale p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-xl">🌳</span>
                        </div>
                        <div>
                            <p style={{ fontFamily: "iMPACT" }} className="text-h4">
                                ENSIGO <span className="text-primary">TRACE</span>
                            </p>
                            <p className="text-caption opacity-75">Empowering information</p>
                        </div>
                    </div>

                    <div className="bg-paper rounded-2xl shadow-custom p-8 lg:p-10">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <h2 className="text-h4 mb-2">Welcome back</h2>
                            <p className="text-body-sm mb-8 opacity-75">
                                Sign in to continue to your dashboard
                            </p>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                                >
                                    <p className="text-body-sm text-red-600">{error}</p>
                                </motion.div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-label mb-2">Email address</label>
                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                                        />
                                        <Input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-label mb-2">Password</label>
                                    <div className="relative">
                                        <Lock
                                            size={18}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                                        />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-8 pr-8"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--placeholder)] hover:text-[var(--very-dark-color)] transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div></div>
                                    {/* <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-[var(--very-dark-color)]/10 text-primary focus:ring-primary"
                                        />
                                        <span className="text-caption">Remember me</span>
                                    </label> */}
                                    <Link
                                        href="/forgot-password"
                                        className="text-caption text-primary hover:underline"
                                    >
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

                            <div className="mt-8 pt-6 border-t border-[var(--very-dark-color)]/10">
                                <p className="text-center text-caption">
                                    Don't have an account?{" "}
                                    <Link
                                        href="/signup"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Sign up
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { ThemeToggle } from "@/components/theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex">
      <div className="fixed top-4 right-4 z-[60]">
        <ThemeToggle />
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <p
              style={{ fontFamily: "iMPACT", fontSize: "2.2rem", lineHeight: "1.1" }}
              className="leading-tight"
            >
              ENSIGO <span className="text-white">TRACE</span>
            </p>
            <p className="opacity-90" style={{ fontSize: "1.1rem" }}>Empowering information</p>
          </div>
          <p className="opacity-90 max-w-md leading-relaxed" style={{ fontSize: "1.35rem" }}>
            Recover access to your account and continue tracking your seed supply network.
          </p>
          <p className="opacity-80" style={{ fontSize: "1.05rem" }}>powered by bvr.africa © 2025</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-pale p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-paper rounded-2xl shadow-custom p-8 lg:p-10 border border-[var(--border)]">
            <h2 className="text-h4 mb-2 text-[var(--very-dark-color)]">Forgot password</h2>
            <p className="text-body-sm mb-6 text-[var(--very-dark-color)]/75">
              Enter your account email and we will help you reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-body-sm text-red-600">{error}</p>
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-label mb-2 text-[var(--very-dark-color)]">Email address</label>
                  <AuthInput
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={18} />}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary-dark text-white">
                  Send reset instructions
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-body-sm">
                    If an account exists for <span className="font-medium">{email}</span>, password reset instructions have been sent.
                  </p>
                </div>
                <Link href="/login" className="inline-flex w-full">
                  <Button variant="pale" className="w-full h-11">
                    Back to sign in
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <Link href="/login" className="inline-flex items-center gap-2 text-caption text-primary hover:underline">
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


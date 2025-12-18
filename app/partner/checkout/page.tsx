"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { CreditCard, Package, MapPin, User, Mail, Phone } from "lucide-react";
import { useUser } from "@/src/hooks/useUser";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6 text-label">Loading checkout…</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    address: "",
    city: "",
    country: "UG",
  });

  const batchId = searchParams.get("batchId");
  const quantity = parseFloat(searchParams.get("quantity") || "0");
  const species = searchParams.get("species") || "";
  const unit = searchParams.get("unit") || "kg";
  const batchNumber = searchParams.get("batchNumber") || "";

  // Hard-coded Flutterwave keys - REPLACE WITH YOUR ACTUAL KEYS
  // Get your keys from: https://dashboard.flutterwave.com/settings/apis
  const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X";
  const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxx-X"; // Not used in frontend, but kept for reference

  // Calculate price (mock pricing: $10 per kg or $0.01 per seed)
  const unitPrice = unit === "kg" ? 10 : 0.01;
  const subtotal = quantity * unitPrice;
  const shipping = 5;
  const total = subtotal + shipping;

  useEffect(() => {
    // Load Flutterwave script
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.id = "flutterwave-script";
    
    // Check if script already exists
    if (!document.getElementById("flutterwave-script")) {
      document.body.appendChild(script);
    }

    return () => {
      const existingScript = document.getElementById("flutterwave-script");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePayment = () => {
    if (!formData.email || !formData.phone || !formData.firstName || !formData.lastName) {
      alert("Please fill in all required fields");
      return;
    }

    if (!batchId) {
      alert("Batch information is missing. Please go back and try again.");
      return;
    }

    setLoading(true);

    // Store order details in sessionStorage for the success page
    const orderDetails = {
      batchId,
      batchNumber,
      species,
      quantity,
      unit,
      pricePerUnit: unitPrice,
      totalAmount: total,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
    };
    sessionStorage.setItem("pendingOrder", JSON.stringify(orderDetails));

    const paymentData = {
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `ENSIGO-${Date.now()}`,
      amount: total,
      currency: "UGX",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: formData.email,
        phone_number: formData.phone,
        name: `${formData.firstName} ${formData.lastName}`,
      },
      customizations: {
        title: "Ensigo Trace - Seed Order",
        description: `Order for ${quantity} ${unit} of ${species}`,
        logo: "https://your-logo-url.com/logo.png",
      },
      meta: {
        batchId: batchId,
        batchNumber: batchNumber,
        species: species,
        quantity: quantity.toString(),
        unit: unit,
      },
      callback: function (response: any) {
        if (response.status === "successful") {
          // Store transaction info
          sessionStorage.setItem("transactionRef", response.tx_ref);
          sessionStorage.setItem("transactionId", response.transaction_id || "");
          router.push(
            `/partner/checkout/success?tx_ref=${response.tx_ref}&transaction_id=${response.transaction_id}`
          );
        } else {
          sessionStorage.removeItem("pendingOrder");
          alert("Payment was not successful. Please try again.");
          setLoading(false);
        }
      },
      onclose: function () {
        setLoading(false);
      },
    };

    if (window.FlutterwaveCheckout) {
      window.FlutterwaveCheckout(paymentData);
    } else {
      alert("Payment gateway is loading. Please wait a moment and try again.");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["partner"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-h4 mb-2">Checkout</h1>
            <p className="text-caption opacity-75">
              Complete your seed order payment securely
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="md:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-h5 flex items-center gap-2">
                    <MapPin size={18} />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-label text-sm">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-label text-sm">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label text-sm">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                      />
                      <Input
                        name="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
                      />
                      <Input
                        name="phone"
                        type="tel"
                        placeholder="+256 700 000 000"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label text-sm">Address</label>
                    <Input
                      name="address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-label text-sm">City</label>
                      <Input
                        name="city"
                        placeholder="Arua"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-label text-sm">Country</label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-h5 flex items-center gap-2">
                    <CreditCard size={18} />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Secure payment powered by Flutterwave
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-pale rounded-lg border border-primary/20">
                    <p className="text-label text-sm mb-2">
                      You will be redirected to Flutterwave secure payment page
                    </p>
                    <p className="text-caption opacity-75 text-xs">
                      We accept card payments, mobile money, and bank transfers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="md:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-h5 flex items-center gap-2">
                    <Package size={18} />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 pb-4 border-b border-[var(--very-dark-color)]/10">
                    <div>
                      <p className="text-label font-medium mb-1">{species}</p>
                      <p className="text-caption opacity-75 text-xs">
                        Batch {batchNumber}
                      </p>
                      <p className="text-caption opacity-75 text-xs mt-1">
                        Quantity: {quantity} {unit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pb-4 border-b border-[var(--very-dark-color)]/10">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-caption opacity-75">Subtotal</span>
                      <span className="text-label">
                        {subtotal.toLocaleString()} UGX
                      </span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-caption opacity-75">Shipping</span>
                      <span className="text-label">
                        {shipping.toLocaleString()} UGX
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-label font-medium">Total</span>
                    <span className="text-h5 text-primary">
                      {total.toLocaleString()} UGX
                    </span>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full mt-6"
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard size={16} className="mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


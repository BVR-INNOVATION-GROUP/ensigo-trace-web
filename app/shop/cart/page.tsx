"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, MapPin, Mail, Phone, User, ArrowLeft, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency";

interface CartItem {
    id: string;
    species: string;
    commonName?: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    nurseryName: string;
    photoUrl?: string;
}

export default function ShopCartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
    const [contactInfo, setContactInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
    });
    const [placingOrder, setPlacingOrder] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem("shopCart");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
        setLoading(false);
    }, []);

    // Check if there's a direct buy from shop page
    useEffect(() => {
        const pendingOrder = sessionStorage.getItem("pendingDirectOrder");
        if (pendingOrder) {
            const order = JSON.parse(pendingOrder);
            setCart([order]);
            setStep("checkout");
            sessionStorage.removeItem("pendingDirectOrder");
        }
    }, []);

    const updateQuantity = (id: string, newQty: number) => {
        if (newQty < 1) {
            removeItem(id);
            return;
        }

        const updatedCart = cart.map(item =>
            item.id === id ? { ...item, quantity: newQty } : item
        );
        setCart(updatedCart);
        localStorage.setItem("shopCart", JSON.stringify(updatedCart));
    };

    const removeItem = (id: string) => {
        const updatedCart = cart.filter(item => item.id !== id);
        setCart(updatedCart);
        localStorage.setItem("shopCart", JSON.stringify(updatedCart));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    const shipping = cart.length > 0 ? 5000 : 0;
    const total = subtotal + shipping;

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContactInfo({
            ...contactInfo,
            [e.target.name]: e.target.value,
        });
    };

    const handleCheckout = () => {
        // Validate
        if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim()) {
            alert("Please enter your name");
            return;
        }
        if (!contactInfo.email.trim() || !contactInfo.phone.trim()) {
            alert("Please enter your email and phone number");
            return;
        }

        setPlacingOrder(true);

        // Simulate order placement
        setTimeout(() => {
            const orderDetails = {
                items: cart,
                contactInfo,
                total,
                orderNumber: `ORD-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            localStorage.setItem("lastOrder", JSON.stringify(orderDetails));
            localStorage.removeItem("shopCart");
            setCart([]);
            setStep("success");
            setPlacingOrder(false);
        }, 1500);
    };

    const getPlaceholderImage = (species: string) => {
        const encodedSpecies = encodeURIComponent(species.split(' ')[0]);
        return `https://placehold.co/100x100/22c55e/white?text=${encodedSpecies}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-[var(--very-dark-color)]/60">Loading cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-paper border-b border-[var(--very-dark-color)]/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="pale" size="sm" onClick={() => router.push("/shop")}>
                                <ArrowLeft size={16} />
                            </Button>
                            <h1 className="text-h4">Your Cart</h1>
                        </div>
                        <Badge className="bg-primary/10 text-primary">
                            {cart.length} item{cart.length !== 1 ? "s" : ""}
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Empty Cart */}
                {cart.length === 0 && step !== "success" && (
                    <div className="text-center py-16">
                        <ShoppingCart size={64} className="mx-auto text-[var(--very-dark-color)]/20 mb-4" />
                        <h2 className="text-h5 mb-2">Your cart is empty</h2>
                        <p className="text-[var(--very-dark-color)]/60 mb-6">
                            Browse our shop to find native tree seeds and seedlings
                        </p>
                        <Button onClick={() => router.push("/shop")}>
                            Browse Shop
                        </Button>
                    </div>
                )}

                {/* Cart Items */}
                {cart.length > 0 && step === "cart" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-pale flex-shrink-0">
                                                <img
                                                    src={item.photoUrl || getPlaceholderImage(item.species)}
                                                    alt={item.species}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = getPlaceholderImage(item.species);
                                                    }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-label font-medium">
                                                    {item.commonName || item.species}
                                                </h3>
                                                <p className="text-caption text-[var(--very-dark-color)]/60">
                                                    Batch: {item.batchNumber}
                                                </p>
                                                <p className="text-caption text-[var(--very-dark-color)]/60">
                                                    {item.nurseryName}
                                                </p>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="w-8 h-8 rounded-full border border-[var(--very-dark-color)]/20 flex items-center justify-center hover:bg-pale"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-body-sm w-8 text-center">{item.quantity}</span>
                                                        <button
                                                            className="w-8 h-8 rounded-full border border-[var(--very-dark-color)]/20 flex items-center justify-center hover:bg-pale"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <p className="text-label font-medium text-primary">
                                                        {formatCurrency(item.pricePerUnit * item.quantity, 'UGX')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Summary */}
                        <Card className="mt-6">
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-body-sm">
                                        <span className="text-[var(--very-dark-color)]/70">Subtotal</span>
                                        <span className="text-label">{formatCurrency(subtotal, 'UGX')}</span>
                                    </div>
                                    <div className="flex justify-between text-body-sm">
                                        <span className="text-[var(--very-dark-color)]/70">Shipping</span>
                                        <span className="text-label">{formatCurrency(shipping, 'UGX')}</span>
                                    </div>
                                    <div className="border-t border-[var(--very-dark-color)]/10 pt-3 flex justify-between">
                                        <span className="text-label font-medium">Total</span>
                                        <span className="text-h5 text-primary font-bold">{formatCurrency(total, 'UGX')}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-6"
                                    size="lg"
                                    onClick={() => setStep("checkout")}
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Checkout - Contact Info */}
                {step === "checkout" && cart.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h5 flex items-center gap-2">
                                    <User size={20} />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-body-sm font-medium">First Name *</label>
                                        <Input
                                            name="firstName"
                                            placeholder="John"
                                            value={contactInfo.firstName}
                                            onChange={handleContactChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-body-sm font-medium">Last Name *</label>
                                        <Input
                                            name="lastName"
                                            placeholder="Doe"
                                            value={contactInfo.lastName}
                                            onChange={handleContactChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-body-sm font-medium">Email *</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--placeholder)]" />
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={contactInfo.email}
                                                onChange={handleContactChange}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-body-sm font-medium">Phone *</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--placeholder)]" />
                                            <Input
                                                name="phone"
                                                type="tel"
                                                placeholder="+256 700 000 000"
                                                value={contactInfo.phone}
                                                onChange={handleContactChange}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-body-sm font-medium">Delivery Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-[var(--placeholder)]" />
                                        <Input
                                            name="address"
                                            placeholder="Your address for delivery"
                                            value={contactInfo.address}
                                            onChange={handleContactChange}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-body-sm font-medium">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        placeholder="Any special instructions for your order..."
                                        value={contactInfo.notes}
                                        onChange={handleContactChange as any}
                                        className="w-full px-3 py-2 rounded-md border border-[var(--very-dark-color)]/20 bg-paper text-body-sm"
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Summary */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-h5">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between text-body-sm">
                                            <span className="text-[var(--very-dark-color)]/70">
                                                {item.commonName || item.species} x {item.quantity}
                                            </span>
                                            <span className="text-label">
                                                {formatCurrency(item.pricePerUnit * item.quantity, 'UGX')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-[var(--very-dark-color)]/10 pt-3 flex justify-between mb-6">
                                    <span className="text-label font-medium">Total</span>
                                    <span className="text-h5 text-primary font-bold">{formatCurrency(total, 'UGX')}</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="pale"
                                        className="flex-1"
                                        onClick={() => setStep("cart")}
                                    >
                                        <ArrowLeft size={16} className="mr-2" />
                                        Back to Cart
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleCheckout}
                                        disabled={placingOrder}
                                    >
                                        {placingOrder ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Place Order
                                                <ArrowRight size={16} className="ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Success */}
                {step === "success" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-h3 mb-4">Order Placed Successfully!</h2>
                        <p className="text-body text-[var(--very-dark-color)]/70 mb-6">
                            Thank you for your order. We will contact you shortly to confirm delivery.
                        </p>
                        <div className="bg-pale rounded-lg p-4 mb-6 inline-block">
                            <p className="text-caption text-[var(--very-dark-color)]/60">Order Total</p>
                            <p className="text-h4 text-primary">{formatCurrency(total, 'UGX')}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button variant="pale" onClick={() => router.push("/shop")}>
                                Continue Shopping
                            </Button>
                            <Button onClick={() => {
                                setStep("cart");
                                router.push("/");
                            }}>
                                Go Home
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
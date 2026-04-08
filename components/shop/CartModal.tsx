"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, ShoppingCart, MapPin, Mail, Phone, User, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency";
import { useToast } from "@/src/hooks/use-toast";
import api, { CreateOnlineOrderRequest } from "@/src/api/client";

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

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: Record<string, number>;
  products: any[];
  onUpdateQuantity: (id: string, quantity: number) => void;
}

export default function CartModal({ isOpen, onClose, cartItems, products, onUpdateQuantity }: CartModalProps) {
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
  const { toast } = useToast();

  // Cart is fully client-side, no backend sync needed

  // Convert cart items map to array
  const cart: CartItem[] = [];
  Object.entries(cartItems).forEach(([id, quantity]) => {
    const product = products.find(p => p.id === id);
    if (product) {
      cart.push({
        id,
        species: product.species,
        commonName: product.commonName,
        batchNumber: product.batchNumber,
        quantity,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
        nurseryName: product.nurseryName,
        photoUrl: product.photoUrl,
      });
    }
  });

  // Type guard function to ensure item is not null
  const isValidItem = (item: CartItem | null): item is CartItem => item !== null;

  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + (item.pricePerUnit * item.quantity), 0);
  const shipping = cart.length > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) {
      onUpdateQuantity(id, 0);
      return;
    }
    onUpdateQuantity(id, newQty);
  };

  const removeItem = (id: string) => {
    onUpdateQuantity(id, 0);
  };

  const getPlaceholderImage = (species: string) => {
    const encodedSpecies = encodeURIComponent(species.split(' ')[0]);
    return `https://placehold.co/100x100/22c55e/white?text=${encodedSpecies}`;
  };

  const handleCheckout = () => {
    // Validate
    if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }
    if (!contactInfo.email.trim() || !contactInfo.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email and phone number",
        variant: "destructive",
      });
      return;
    }

    setPlacingOrder(true);

    // Show processing toast
    toast({
      title: "Processing Order",
      description: "Placing your order and sending notifications...",
    });

    // Create order with backend integration
    const placeOrder = async () => {
      try {
        // Create individual orders for each cart item (as required by backend API)
        const orderPromises = cart.map(async (item) => {
          const orderData = {
            batch_id: item.id,
            customer_name: `${contactInfo.firstName} ${contactInfo.lastName}`,
            customer_email: contactInfo.email,
            customer_phone: contactInfo.phone,
            quantity: item.quantity,
            price_per_unit: item.pricePerUnit,
            payment_method: "cash", // Default payment method
            transaction_reference: "",
            notes: contactInfo.notes || "",
            order_type: "online" as const
          };

          return await api.createOnlineOrder(orderData as CreateOnlineOrderRequest);
        });

        // Wait for all orders to be created
        const orderResponses = await Promise.all(orderPromises);

        // Store order details locally for reference
        const orderDetails = {
          items: cart.map((item) => {
            return {
              id: item.id,
              species: item.species,
              commonName: item.commonName,
              batchNumber: item.batchNumber,
              quantity: item.quantity,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              nurseryName: item.nurseryName,
              photoUrl: item.photoUrl,
            };
          }),
          contactInfo,
          total,
          orderNumbers: orderResponses.map(order => order.sale_number),
          createdAt: new Date().toISOString(),
        };

        // Store order details locally
        localStorage.setItem("lastOrder", JSON.stringify(orderDetails));
        localStorage.removeItem("shopCart");

        // Success toast with email notification info
        const orderNumbersText = orderDetails.orderNumbers.length > 1
          ? `Orders ${orderDetails.orderNumbers.join(", ")} have been received.`
          : `Order ${orderDetails.orderNumbers[0]} has been received.`;

        toast({
          title: "Order Placed Successfully!",
          description: `${orderNumbersText} The regional nursery will review your order and you'll receive email confirmation shortly.`,
          variant: "success",
        });

        setStep("success");
        setPlacingOrder(false);
        onClose(); // Close modal after successful order

        // Notify parent component of cart changes
        Object.keys(cartItems).forEach(id => {
          onUpdateQuantity(id, 0);
        });

      } catch (err) {
        console.error("Error placing order:", err);
        toast({
          title: "Order Failed",
          description: "There was an error placing your order. Please try again or contact support.",
          variant: "destructive",
        });
        setPlacingOrder(false);
      }
    };

    placeOrder();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end p-4"
      >
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-paper rounded-l-lg shadow-xl max-w-md lg:max-w-[30vw] w-full h-full overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-primary" size={24} />
              <h1 className="text-h4">Your Cart</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary">
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </Badge>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Empty Cart */}
            {cart.length === 0 && step !== "success" && (
              <div className="text-center py-16 px-6">
                <ShoppingCart size={64} className="mx-auto text-[var(--very-dark-color)]/20 mb-4" />
                <h2 className="text-h5 mb-2">Your cart is empty</h2>
                <p className="text-[var(--very-dark-color)]/60 mb-6">
                  Browse our shop to find native tree seeds and seedlings
                </p>
                <Button onClick={() => setStep("cart")}>
                  Browse Shop
                </Button>
              </div>
            )}

            {/* Cart Items */}
            {cart.length > 0 && step === "cart" && (
              <div className="p-6 space-y-4">
                {cart.filter(isValidItem).map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden relative bg-[var(--card)]">
                    <CardContent className="p-4">
                      {/* Delete Button - Top Right */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                      >
                        <Trash2 size={18} />
                      </Button>

                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-pale flex-shrink-0">
                          <img
                            src={item.photoUrl || getPlaceholderImage(item.species)}
                            alt={item.species}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getPlaceholderImage(item.species);
                            }}
                          />
                          {/* Stock status badge */}
                          <div className="absolute bottom-2 left-2 bg-white/20 backdrop-blur-lg text-white text-xs px-2 py-1 rounded-full">
                            In Stock
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-base font-medium line-clamp-2 leading-relaxed mb-1">
                              {item.commonName || item.species}
                            </h3>
                            {item.commonName && (
                              <p className="text-sm text-[var(--very-dark-color)]/60 truncate leading-relaxed mb-2">
                                {item.species}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-[var(--very-dark-color)]/60 mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin size={10} />
                                <span className="truncate">{item.nurseryName}</span>
                              </div>
                              <span className="text-xs">•</span>
                              <span>Batch: {item.batchNumber}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8"
                              >
                                -
                              </Button>
                              <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8"
                              >
                                +
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {formatCurrency(item.pricePerUnit * item.quantity, 'UGX')}
                              </p>
                              <p className="text-xs text-[var(--very-dark-color)]/50">
                                {formatCurrency(item.pricePerUnit, 'UGX')} / {item.unit}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

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
              </div>
            )}

            {/* Checkout - Contact Info */}
            {step === "checkout" && cart.length > 0 && (
              <div className="p-6">
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
                          onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-body-sm font-medium">Last Name *</label>
                        <Input
                          name="lastName"
                          placeholder="Doe"
                          value={contactInfo.lastName}
                          onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
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
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
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
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
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
                          onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
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
                        onChange={(e) => setContactInfo({ ...contactInfo, notes: e.target.value })}
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
              </div>
            )}

            {/* Success */}
            {step === "success" && (
              <div className="text-center py-12 px-6">
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
                  <Button variant="pale" onClick={onClose}>
                    Continue Shopping
                  </Button>
                  <Button onClick={() => {
                    setStep("cart");
                    onClose();
                  }}>
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

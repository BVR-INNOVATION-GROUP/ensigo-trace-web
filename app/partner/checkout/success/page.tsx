"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SalesService } from "@/src/services/SalesService";
import { mockSeedBatches, mockNurseries } from "@/src/data/mockData";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-label">Loading…</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [txRef, setTxRef] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    const txRefParam = searchParams.get("tx_ref");
    const transactionIdParam = searchParams.get("transaction_id");

    if (txRefParam) setTxRef(txRefParam);
    if (transactionIdParam) setTransactionId(transactionIdParam);

    // Create order record after successful payment
    const createOrder = async () => {
      const orderData = sessionStorage.getItem("pendingOrder");
      const storedTxRef = sessionStorage.getItem("transactionRef");
      const storedTxId = sessionStorage.getItem("transactionId");

      if (!orderData || orderCreated) return;

      try {
        const order = JSON.parse(orderData);
        
        // Find the batch to get nurseryId
        const batch = mockSeedBatches.find((b) => b.id === order.batchId);
        if (!batch || !batch.nurseryId) {
          console.error("Batch or nursery not found");
          return;
        }

        const salesService = new SalesService();
        const result = await salesService.createSale({
          batchId: order.batchId,
          species: order.species,
          quantity: order.quantity,
          unit: order.unit as "kg" | "seeds",
          pricePerUnit: order.pricePerUnit,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          paymentMethod: "flutterwave",
          saleDate: new Date().toISOString().split("T")[0],
          nurseryId: batch.nurseryId,
        });

        if (result.success && result.data) {
          // Update payment status to paid
          await salesService.updatePaymentStatus(
            result.data.id,
            "paid",
            storedTxId || storedTxRef || transactionIdParam || ""
          );
          setOrderCreated(true);
          
          // Clean up session storage
          sessionStorage.removeItem("pendingOrder");
          sessionStorage.removeItem("transactionRef");
          sessionStorage.removeItem("transactionId");
        }
      } catch (error) {
        console.error("Error creating order:", error);
      }
    };

    if (txRefParam && transactionIdParam) {
      createOrder();
    }
  }, [searchParams, orderCreated, transactionId]);

  return (
    <ProtectedRoute allowedRoles={["partner"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-primary" />
                </div>
              </motion.div>

              <h1 className="text-h4 mb-2">Payment Successful!</h1>
              <p className="text-caption opacity-75 mb-8">
                Your order has been confirmed and payment received
              </p>

              <div className="space-y-4 mb-8">
                {txRef && (
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-caption opacity-75 mb-1">Transaction Reference</p>
                    <p className="text-label font-mono">{txRef}</p>
                  </div>
                )}
                {transactionId && (
                  <div className="p-4 bg-pale rounded-lg">
                    <p className="text-caption opacity-75 mb-1">Transaction ID</p>
                    <p className="text-label font-mono">{transactionId}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/partner/projects">
                  <Button variant="outline">
                    <Package size={16} className="mr-2" />
                    View Projects
                  </Button>
                </Link>
                <Link href="/partner/browse">
                  <Button>
                    Continue Shopping
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}






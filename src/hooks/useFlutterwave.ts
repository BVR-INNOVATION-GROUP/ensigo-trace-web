import { useEffect } from "react";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export function useFlutterwave() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.id = "flutterwave-script";
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
}

export function processFlutterwavePayment(
  sale: {
    id: string;
    saleNumber: string;
    totalAmount: number;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    quantity: number;
    unit: string;
    species: string;
    batchId: string;
  },
  onSuccess: (transactionId?: string) => void,
  onError: (message?: string) => void
) {
  const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X";

  const paymentData = {
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: sale.saleNumber,
    amount: sale.totalAmount,
    currency: "UGX",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: sale.customerEmail,
      phone_number: sale.customerPhone,
      name: sale.customerName,
    },
    customizations: {
      title: "Ensigo Trace - Tree Sale",
      description: `Sale of ${sale.quantity} ${sale.unit} of ${sale.species}`,
      logo: "https://your-logo-url.com/logo.png",
    },
    meta: {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      batchId: sale.batchId,
    },
    callback: function (response: any) {
      if (response.status === "successful") {
        onSuccess(response.transaction_id);
      } else {
        onError("Payment was not successful. Please try again.");
      }
    },
    onclose: function () {
      console.log("Payment modal closed");
    },
  };

  if (window.FlutterwaveCheckout) {
    window.FlutterwaveCheckout(paymentData);
  } else {
    onError("Payment gateway is loading. Please wait a moment and try again.");
  }
}


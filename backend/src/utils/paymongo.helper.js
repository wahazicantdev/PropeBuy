import {
  PAYMONGO_BASE_URL,
  PAYMONGO_V2_URL,
  getPayMongoAuthHeader,
} from "../config/paymongo.js";
import { PAYMENT_SUCCESS_URL, PAYMENT_FAILED_URL } from "../config/env.js";

// ── CREATE CHECKOUT SESSION ──────────────────────────
// Hosted Checkout is the current PayMongo API for online payment
// Legacy Links had no redirect support, sessions return the buyer home
// Called AFTER the TPS transaction commits successfully
// amount     — total order amount in PHP
// orderId    — our internal order ID for tracking
// description — shown to buyer on the payment screen
export const createCheckoutSession = async (amount, orderId, description) => {
  // PayMongo requires amount in centavos — multiply by 100
  // Example: 85.50 pesos → 8550 centavos
  const amountInCentavos = Math.round(parseFloat(amount) * 100);

  // Call PayMongo Checkout Sessions API directly using fetch
  // QRPh covers GCash QR payments plus other wallets and banks
  const response = await fetch(`${PAYMONGO_V2_URL}/checkout_sessions`, {
    method: "POST",
    headers: {
      // Content type must be JSON
      "Content-Type": "application/json",
      // Authorization uses our encoded secret key
      Authorization: getPayMongoAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          // One line item for the whole order total
          line_items: [
            {
              name: description || `PropeBuy Order #${orderId}`,
              amount: amountInCentavos,
              currency: "PHP",
              quantity: 1,
            },
          ],
          // QRPh method for GCash and wallet QR payments
          payment_method_types: ["qrph"],
          // Return trip — PayMongo sends the buyer back after pay or cancel
          success_url: `${PAYMENT_SUCCESS_URL}?orderId=${orderId}`,
          cancel_url: `${PAYMENT_FAILED_URL}?orderId=${orderId}`,
          // Our order tag, visible in PayMongo dashboard
          reference_number: `PROPEBUY-${orderId}`,
          description: description || `PropeBuy Order #${orderId}`,
        },
      },
    }),
  });

  // Parse the PayMongo response
  const data = await response.json();

  // If PayMongo returned an error — throw it
  // This will be caught by our error handler middleware
  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.detail || "Failed to create PayMongo checkout session",
    );
  }

  // Return the important parts of the PayMongo response
  return {
    // URL to send buyer to for payment, same-tab redirect
    checkoutUrl: data.data.attributes.checkout_url,
    // PayMongo reference number — shown to buyer after payment
    referenceNumber: data.data.attributes.reference_number,
    // PayMongo session ID — used to check payment status later
    sessionId: data.data.id,
  };
};

// ── VERIFY PAYMENT STATUS ──────────────────────────────
// Checks the current status of a PayMongo checkout session
// Used as fallback when webhook delivery fails
// sessionId — the PayMongo session ID we saved on the order
export const verifyPaymentStatus = async (sessionId) => {
  // Retrieve lives on v1 even though create lives on v2
  // Wrong version answers route does not exist
  const response = await fetch(
    `${PAYMONGO_BASE_URL}/checkout_sessions/${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: getPayMongoAuthHeader(),
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.detail || "Failed to verify payment status",
    );
  }

  // Session attributes carry status in a few possible shapes
  // Probe each known location before falling back to unpaid
  const attrs = data.data?.attributes || {};
  // Direct status fields first
  if (attrs.status === "paid" || attrs.payment_status === "paid") return "paid";
  // Then the nested payments array, any paid entry counts
  const payments = attrs.payments || [];
  if (
    payments.some(
      (p) => p?.attributes?.status === "paid" || p?.status === "paid",
    )
  ) {
    return "paid";
  }

  // Anything else means money has not arrived yet
  return "unpaid";
};

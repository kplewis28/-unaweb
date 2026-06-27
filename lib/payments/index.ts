import type { PaymentAdapter } from "./types";
import { StripeAdapter } from "./stripe";

export function getPaymentAdapter(): PaymentAdapter {
  const provider = process.env.PAYMENT_PROVIDER ?? "stripe";

  switch (provider) {
    case "stripe":
      return new StripeAdapter();
    default:
      throw new Error(`Unknown payment provider: "${provider}"`);
  }
}

export type { PaymentAdapter, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "./types";

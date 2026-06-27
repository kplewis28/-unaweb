import Stripe from "stripe";
import type {
  PaymentAdapter,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from "./types";

export class StripeAdapter implements PaymentAdapter {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: params.retreatName,
              description: `Retiro ÚNA · Código de acceso: ${params.accessCode}`,
            },
            unit_amount: Math.round(params.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        applicationId: params.applicationId,
        accessCode: params.accessCode,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      url: session.url!,
      sessionId: session.id,
    };
  }

  async verifyWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookEvent | null> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: "payment.succeeded",
          sessionId: session.id,
          applicationId: session.metadata?.applicationId ?? "",
        };
      }

      if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: "payment.failed",
          sessionId: session.id,
          applicationId: session.metadata?.applicationId ?? "",
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

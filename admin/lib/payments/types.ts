export interface CreateCheckoutParams {
  applicationId: string;
  retreatName: string;
  price: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  accessCode: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface PaymentAdapter {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookEvent | null>;
}

export interface WebhookEvent {
  type: "payment.succeeded" | "payment.failed";
  sessionId: string;
  applicationId: string;
}

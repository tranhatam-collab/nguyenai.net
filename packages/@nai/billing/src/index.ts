/**
 * @nai/billing — Payment gateway abstraction for Nguyen AI.
 *
 * Supports two gateways:
 *   - Stripe (USD, international, subscriptions, one-time)
 *   - VNPay (VND, Vietnam domestic, one-time + recurring)
 *
 * Per ECOSYSTEM_SOURCE_OF_TRUTH.md: VNPay + Stripe.
 * Per prices.json: 12 items with VND + USD pricing.
 *
 * Design:
 *   - Gateway-agnostic checkout session creation
 *   - Webhook signature verification (Stripe + VNPay)
 *   - Invoice record generation
 *   - Subscription state (stored in D1/Postgres by caller)
 *   - No card storage — PCI-DSS scoped out
 */

// ============================================================
// Types
// ============================================================

export type Gateway = 'stripe' | 'vnpay' | 'payos';
export type Currency = 'VND' | 'USD';
export type PaymentPeriod = 'month' | 'year' | 'per-attempt' | 'one-time';

export interface PriceItem {
  id: string;
  name: string;
  name_vi: string;
  name_en: string;
  price_vnd: number;
  price_usd: number;
  currency: Currency;
  period: PaymentPeriod;
  status: string;
  entitlement_key: string;
  entitlement_value: boolean;
  description_vi: string;
  description_en: string;
}

export interface CheckoutRequest {
  price_id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  currency: Currency;
  gateway: Gateway;
  success_url: string;
  cancel_url: string;
  locale: 'vi' | 'en';
}

export interface CheckoutSession {
  session_id: string;
  gateway: Gateway;
  authorize_url: string;
  amount: number;
  currency: Currency;
  price_id: string;
  user_id: string;
  expires_at: string;
}

export interface PaymentResult {
  payment_id: string;
  gateway: Gateway;
  gateway_payment_id: string;
  amount: number;
  currency: Currency;
  price_id: string;
  user_id: string;
  tenant_id: string;
  status: 'paid' | 'failed' | 'pending' | 'refunded';
  paid_at: string;
  raw: Record<string, unknown>;
}

export interface InvoiceRecord {
  invoice_id: string;
  payment_id: string;
  user_id: string;
  tenant_id: string;
  price_id: string;
  amount: number;
  currency: Currency;
  vat_amount: number;
  vat_rate: number;
  status: 'issued' | 'void' | 'refunded';
  issued_at: string;
  issued_by_entity: 'VIET_CAN_NEW_CORP' | 'KASAN_JSC';
}

// ============================================================
// VAT policy
// ============================================================

// Vietnam customers: Kasan JSC issues VAT 10%
// International customers: VIET CAN NEW CORP, no VAT on export
export function computeVat(amount: number, currency: Currency, isVietnamCustomer: boolean): {
  vat_amount: number;
  vat_rate: number;
  issuing_entity: 'VIET_CAN_NEW_CORP' | 'KASAN_JSC';
} {
  if (currency === 'VND' || isVietnamCustomer) {
    return { vat_amount: Math.round(amount * 0.10), vat_rate: 0.10, issuing_entity: 'KASAN_JSC' };
  }
  return { vat_amount: 0, vat_rate: 0, issuing_entity: 'VIET_CAN_NEW_CORP' };
}

// ============================================================
// Stripe checkout session creation
// ============================================================

export interface StripeEnv {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

/**
 * Create a Stripe Checkout Session.
 * Uses Stripe Checkout (hosted) — no card data touches our servers.
 */
export async function createStripeCheckout(
  env: StripeEnv,
  req: CheckoutRequest,
  price: PriceItem,
): Promise<CheckoutSession> {
  const amount = req.currency === 'USD' ? price.price_usd : price.price_vnd;
  const sessionId = crypto.randomUUID();

  // Stripe expects amount in smallest unit (cents)
  const stripeAmount = req.currency === 'USD' ? Math.round(amount * 100) : amount;

  const body = new URLSearchParams({
    mode: price.period === 'month' || price.period === 'year' ? 'subscription' : 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': req.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(stripeAmount),
    'line_items[0][price_data][product_data][name]': req.locale === 'vi' ? price.name_vi : price.name_en,
    'line_items[0][price_data][recurring][interval]': price.period === 'year' ? 'year' : 'month',
    'customer_email': req.email,
    'client_reference_id': `${req.user_id}:${req.tenant_id}:${price.id}`,
    'success_url': req.success_url,
    'cancel_url': req.cancel_url,
    'metadata[user_id]': req.user_id,
    'metadata[tenant_id]': req.tenant_id,
    'metadata[price_id]': price.id,
    'metadata[session_id]': sessionId,
  });

  // Only add recurring if subscription mode
  if (price.period === 'per-attempt' || price.period === 'one-time') {
    body.delete('line_items[0][price_data][recurring][interval]');
  }

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Stripe checkout creation failed: ${errText}`);
  }

  const session = await resp.json() as { id: string; url: string; expires_at: number };

  return {
    session_id: sessionId,
    gateway: 'stripe',
    authorize_url: session.url,
    amount,
    currency: req.currency,
    price_id: price.id,
    user_id: req.user_id,
    expires_at: new Date(session.expires_at * 1000).toISOString(),
  };
}

// ============================================================
// Stripe webhook verification
// ============================================================

/**
 * Verify Stripe webhook signature.
 * Stripe sends Stripe-Signature header: t=...,v1=...
 */
export async function verifyStripeWebhook(
  env: StripeEnv,
  payload: string,
  signatureHeader: string,
): Promise<boolean> {
  const parts = signatureHeader.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);

  // Recompute: HMAC-SHA256(timestamp.payload, webhook_secret)
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(sigBuf), (b) => b.toString(16).padStart(2, '0')).join('');

  // Constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return false;

  // Reject if older than 5 minutes
  const age = Date.now() / 1000 - parseInt(timestamp, 10);
  return age < 300;
}

/**
 * Parse Stripe webhook event into PaymentResult.
 */
export function parseStripeEvent(event: Record<string, unknown>): PaymentResult | null {
  const eventType = event.type as string;
  if (eventType !== 'checkout.session.completed' && eventType !== 'invoice.paid') return null;

  const obj = (event.data as { object: Record<string, unknown> }).object;
  const metadata = (obj.metadata as Record<string, string>) ?? {};
  const amountTotal = (obj.amount_total as number) ?? 0;
  const currency = ((obj.currency as string) ?? 'usd').toUpperCase() as Currency;

  return {
    payment_id: crypto.randomUUID(),
    gateway: 'stripe',
    gateway_payment_id: (obj.id as string) ?? (obj.payment_intent as string),
    amount: currency === 'USD' ? amountTotal / 100 : amountTotal,
    currency,
    price_id: metadata.price_id ?? '',
    user_id: metadata.user_id ?? '',
    tenant_id: metadata.tenant_id ?? '',
    status: 'paid',
    paid_at: new Date().toISOString(),
    raw: obj,
  };
}

// ============================================================
// VNPay checkout (VND only)
// ============================================================

export interface VnPayEnv {
  VNPAY_TMN_CODE: string;
  VNPAY_HASH_SECRET: string;
  VNPAY_PAY_URL: string; // e.g. https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  VNPAY_RETURN_URL: string;
}

/**
 * Create VNPay payment URL.
 * VNPay uses query-string signing with HMAC-SHA512.
 */
export async function createVnPayCheckout(
  env: VnPayEnv,
  req: CheckoutRequest,
  price: PriceItem,
): Promise<CheckoutSession> {
  if (req.currency !== 'VND') {
    throw new Error('VNPay only supports VND');
  }

  const amount = price.price_vnd;
  const sessionId = crypto.randomUUID();
  const txnRef = sessionId.replace(/-/g, '').slice(0, 16);
  const now = new Date();
  const createDate = formatDateVnPay(now);

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.VNPAY_TMN_CODE,
    vnp_Amount: String(amount * 100), // VNPay expects x100
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: req.locale === 'vi' ? price.name_vi : price.name_en,
    vnp_OrderType: 'other',
    vnp_Locale: req.locale === 'vi' ? 'vn' : 'en',
    vnp_ReturnUrl: req.success_url,
    vnp_CreateDate: createDate,
    vnp_IpAddr: '127.0.0.1',
  };

  // Sort params alphabetically and build query string
  const sorted = Object.keys(params).sort();
  const queryString = sorted.map((k) => `${k}=${encodeURIComponent(params[k] ?? '')}`).join('&');

  // HMAC-SHA512
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.VNPAY_HASH_SECRET),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(queryString));
  const signature = Array.from(new Uint8Array(sigBuf), (b) => b.toString(16).padStart(2, '0')).join('');

  const authorizeUrl = `${env.VNPAY_PAY_URL}?${queryString}&vnp_SecureHash=${signature}`;

  return {
    session_id: sessionId,
    gateway: 'vnpay',
    authorize_url: authorizeUrl,
    amount,
    currency: 'VND',
    price_id: price.id,
    user_id: req.user_id,
    expires_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
  };
}

function formatDateVnPay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * Verify VNPay return signature.
 */
export async function verifyVnPayReturn(
  env: VnPayEnv,
  params: Record<string, string>,
): Promise<boolean> {
  const secureHash = params.vnp_SecureHash;
  if (!secureHash) return false;

  // Remove secure hash, sort, rebuild query
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;
  const sorted = Object.keys(rest).sort();
  const queryString = sorted.map((k) => `${k}=${rest[k]}`).join('&');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.VNPAY_HASH_SECRET),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(queryString));
  const expected = Array.from(new Uint8Array(sigBuf), (b) => b.toString(16).padStart(2, '0')).join('');

  if (expected.length !== secureHash.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ secureHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Parse VNPay return params into PaymentResult.
 */
export function parseVnPayReturn(params: Record<string, string>): PaymentResult {
  const amount = parseInt(params.vnp_Amount ?? '0', 10) / 100;
  const status = params.vnp_ResponseCode === '00' ? 'paid' : 'failed';

  return {
    payment_id: crypto.randomUUID(),
    gateway: 'vnpay',
    gateway_payment_id: params.vnp_TxnRef ?? '',
    amount,
    currency: 'VND',
    price_id: '', // caller must look up by txnRef
    user_id: '',
    tenant_id: '',
    status: status as PaymentResult['status'],
    paid_at: new Date().toISOString(),
    raw: params,
  };
}

// ============================================================
// pay-gateway.nguyenai.net checkout (VietQR / PayOS — VND, merchant of record: KASAN JSC)
// ============================================================
//
// Canonical payment gateway. Every VN VietQR payment routes through pay-gateway.nguyenai.net
// (F10 lock — no direct provider bypass). Settlement lands in KASAN JSC's bank
// account via a dedicated provider_accounts row for tenant=nguyenai
// (dedicated_prov=1). Without that row pay-gateway.nguyenai.net falls back to the global
// PayOS merchant (V1 Thành Tâm Phát) — WRONG entity — so the row is mandatory
// for legal correctness. See docs/architecture/NGUYEN_AI_PAYMENT_KASAN_VIETQR_BUILD_SPEC.

export interface PayOsEnv {
  PAY_GATEWAY_BASE_URL?: string;     // default https://pay-gateway.nguyenai.net
  PAY_GATEWAY_API_KEY: string;       // minted by pay-gateway.nguyenai.net for tenant=nguyenai
  PAY_GATEWAY_TENANT_CODE?: string;  // default "nguyenai"
  PAY_GATEWAY_SITE_CODE?: string;    // default "nguyenai"
  PAY_GATEWAY_PROVIDER?: string;     // default "payos"
  PAY_GATEWAY_CALLBACK_BASE?: string; // default https://api.nguyenai.net
}

/**
 * Create a VietQR checkout via pay-gateway.nguyenai.net /internal/checkout-session.
 * Auth: x-api-key header (NOT Bearer). Idempotency: x-idempotency-key.
 * Returns a pay.payos.vn hosted VietQR page URL.
 */
export async function createPayOsCheckout(
  env: PayOsEnv,
  req: CheckoutRequest,
  price: PriceItem,
): Promise<CheckoutSession> {
  const amount = price.price_vnd; // integer VND, no subunit
  const sessionId = crypto.randomUUID();
  const internalOrderId = `nai-${(req.tenant_id || 'anon')}-${sessionId.replace(/-/g, '').slice(0, 16)}`;
  const base = String(env.PAY_GATEWAY_BASE_URL || 'https://pay-gateway.nguyenai.net').replace(/\/+$/, '');
  const callbackBase = String(env.PAY_GATEWAY_CALLBACK_BASE || 'https://api.nguyenai.net').replace(/\/+$/, '');

  const resp = await fetch(`${base}/internal/checkout-session`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': String(env.PAY_GATEWAY_API_KEY),
      'x-idempotency-key': internalOrderId,
    },
    body: JSON.stringify({
      tenant_code: String(env.PAY_GATEWAY_TENANT_CODE || 'nguyenai'),
      site_code: String(env.PAY_GATEWAY_SITE_CODE || 'nguyenai'),
      provider: String(env.PAY_GATEWAY_PROVIDER || 'payos'),
      internal_order_id: internalOrderId,
      amount,
      currency: 'VND',
      billing_cycle: 'one_time',
      description: (req.locale === 'vi' ? price.name_vi : price.name_en).slice(0, 200),
      email: req.email || null,
      full_name: null,
      callback_url: `${callbackBase}/v1/payment/webhook`,
      success_url: req.success_url,
      cancel_url: req.cancel_url,
      metadata: {
        user_id: req.user_id,
        tenant_id: req.tenant_id,
        price_id: price.id,
        session_id: sessionId,
        source: 'nai-billing',
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`pay-gateway.nguyenai.net checkout creation failed (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as {
    checkout_url?: string;
    payment_link?: string;
    provider_order_id?: string;
    payment_session_id?: string;
  };
  const url = data.checkout_url || data.payment_link || null;
  if (!url) {
    throw new Error('pay-gateway.nguyenai.net returned no checkout_url');
  }

  return {
    session_id: sessionId,
    gateway: 'payos',
    authorize_url: url,
    amount,
    currency: 'VND',
    price_id: price.id,
    user_id: req.user_id,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

export interface PayOsWebhookEnv {
  PAY_NAI_HMAC: string; // shared secret; same value registered at pay-gateway.nguyenai.net as webhook_secret
}

/**
 * Verify a pay-gateway.nguyenai.net webhook: HMAC-SHA256 hex over the raw request body.
 * Header: x-iai-signature (fallback x-webhook-signature). Constant-time compare.
 */
export async function verifyPayOsWebhook(
  env: PayOsWebhookEnv,
  rawBody: string,
  signatureHex: string,
): Promise<boolean> {
  if (!signatureHex || !env.PAY_NAI_HMAC) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.PAY_NAI_HMAC),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuf), (b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Parse a pay-gateway.nguyenai.net webhook body into a PaymentResult.
 * Paid gate: event_type ∈ { payment.completed, order.paid }.
 * Returns null for non-terminal / non-paid events.
 */
export function parsePayOsWebhook(body: Record<string, unknown>): PaymentResult | null {
  const eventType = String(body.event_type ?? '');
  if (eventType !== 'payment.completed' && eventType !== 'order.paid') return null;
  const md = (body.metadata as Record<string, string>) ?? {};
  return {
    payment_id: crypto.randomUUID(),
    gateway: 'payos',
    gateway_payment_id: String(body.order_id ?? body.provider_order_id ?? ''),
    amount: Number(body.amount) || 0,
    currency: 'VND',
    price_id: md.price_id ?? '',
    user_id: md.user_id ?? '',
    tenant_id: md.tenant_id ?? '',
    status: 'paid',
    paid_at: new Date().toISOString(),
    raw: body,
  };
}

// ============================================================
// Invoice generation
// ============================================================

export function generateInvoice(
  payment: PaymentResult,
  isVietnamCustomer: boolean,
): InvoiceRecord {
  const vat = computeVat(payment.amount, payment.currency, isVietnamCustomer);
  return {
    invoice_id: `INV-${payment.payment_id.slice(0, 12).toUpperCase()}`,
    payment_id: payment.payment_id,
    user_id: payment.user_id,
    tenant_id: payment.tenant_id,
    price_id: payment.price_id,
    amount: payment.amount,
    currency: payment.currency,
    vat_amount: vat.vat_amount,
    vat_rate: vat.vat_rate,
    status: 'issued',
    issued_at: new Date().toISOString(),
    issued_by_entity: vat.issuing_entity,
  };
}

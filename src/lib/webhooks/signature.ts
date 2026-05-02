// Validación de firmas de webhooks (para múltiples proveedores)

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validar firma HMAC-SHA256 (Bird, n8n, custom)
 */
export function validateHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const expectedSignature = createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Validar firma tipo "Bearer Token"
 */
export function validateBearerToken(token: string, secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/**
 * Extraer firma de headers según estándar del proveedor
 */
export function extractSignature(
  headers: Headers,
  provider: 'bird' | 'n8n' | 'brevo' | 'stripe' | 'vapi'
): string | null {
  switch (provider) {
    case 'bird':
      return headers.get('x-bird-signature');
    case 'n8n':
      return headers.get('x-n8n-signature');
    case 'brevo':
      return headers.get('x-brevo-signature');
    case 'stripe':
      return headers.get('stripe-signature');
    case 'vapi':
      return headers.get('x-vapi-signature');
    default:
      return null;
  }
}

/**
 * Validar firma según proveedor
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null,
  provider: 'bird' | 'n8n' | 'brevo' | 'stripe' | 'vapi',
  secret: string
): boolean {
  if (!signature) {
    console.warn(`[signature] No signature provided for ${provider}`);
    return false;
  }

  try {
    switch (provider) {
      case 'bird':
      case 'n8n':
      case 'brevo':
      case 'vapi':
        return validateHmacSignature(payload, signature, secret, 'sha256');

      case 'stripe':
        // Stripe usa formato "t=timestamp,v1=signature"
        const parts = signature.split(',');
        const sigPart = parts.find(p => p.startsWith('v1='));
        if (!sigPart) return false;
        const actualSig = sigPart.replace('v1=', '');
        const timestamp = parts.find(p => p.startsWith('t='))?.replace('t=', '') || '';
        const signedContent = `${timestamp}.${payload}`;
        return validateHmacSignature(signedContent, actualSig, secret, 'sha256');

      default:
        return false;
    }
  } catch (error) {
    console.error(`[signature] Validation error for ${provider}:`, error);
    return false;
  }
}

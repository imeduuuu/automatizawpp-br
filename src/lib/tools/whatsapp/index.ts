/**
 * WhatsApp Tool — Send via Bird API
 */

export interface WhatsAppPayload {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface WhatsAppResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppTool(payload: WhatsAppPayload): Promise<WhatsAppResult> {
  // Implementation pending — requires Bird API integration
  return { sent: false, error: "WhatsApp tool not implemented" };
}

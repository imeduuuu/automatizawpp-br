/**
 * Email Tool — Send emails via Resend or SMTP
 * Atomic, testable, deterministic
 */

import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  provider: "resend" | "smtp";
}

/**
 * Send email via Resend (primary)
 */
export async function sendEmailViaResend(payload: EmailPayload): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, error: "RESEND_API_KEY not configured", provider: "resend" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM || "AutomatizaWPP <hola@automatizawpp.com>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html || `<p>${payload.body}</p>`,
      replyTo: payload.replyTo,
      cc: payload.cc,
      bcc: payload.bcc,
    });

    if (response.error) {
      return {
        sent: false,
        error: response.error.message,
        provider: "resend",
      };
    }

    return {
      sent: true,
      messageId: response.data?.id,
      provider: "resend",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { sent: false, error: message, provider: "resend" };
  }
}

/**
 * Send email via SMTP (fallback)
 */
export async function sendEmailViaSMTP(payload: EmailPayload): Promise<EmailResult> {
  // Placeholder for SMTP implementation
  // Can use nodemailer or similar
  return {
    sent: false,
    error: "SMTP not implemented yet",
    provider: "smtp",
  };
}

/**
 * Main email tool — tries Resend first, falls back to SMTP
 */
export async function sendEmailTool(payload: EmailPayload): Promise<EmailResult> {
  const result = await sendEmailViaResend(payload);

  if (result.sent) {
    return result;
  }

  // Fallback to SMTP if Resend fails
  console.warn(`Resend failed: ${result.error}, trying SMTP`);
  return sendEmailViaSMTP(payload);
}

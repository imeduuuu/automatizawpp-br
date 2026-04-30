import { ChannelType } from '@prisma/client';

export type Channel = ChannelType;

export interface SendOptions {
  to: string;
  subject?: string;
  body: string;
  channel: Channel;
}

export interface OutboundDeliveryResult {
  sent: boolean;
  messageId?: string;
}

export async function routeMessage(options: SendOptions): Promise<{ sent: boolean; messageId?: string }> {
  const { channel, to, body, subject } = options;

  try {
    if (channel === 'EMAIL') {
      return await sendEmail({ to, subject: subject || 'AutomatizaWPP', body });
    }
    if (channel === 'WHATSAPP') {
      return await sendWhatsApp({ to, body });
    }
    if (channel === 'SMS') {
      return await sendSMS({ to, body });
    }
    return { sent: false };
  } catch (error) {
    console.error(`Failed to send via ${channel}:`, error);
    return { sent: false };
  }
}

async function sendEmail(opts: { to: string; subject: string; body: string }) {
  if (process.env.EMAIL_PROVIDER === 'bird') {
    return sendBirdEmail(opts);
  }

  // Resend (priority)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'AutomatizaWPP <hola@automatizawpp.com>',
        to: [opts.to],
        subject: opts.subject,
        html: `<p>${opts.body.replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (response.ok) {
      const data = await response.json() as { id?: string };
      return { sent: true, messageId: data.id };
    }
  }

  // Brevo (fallback)
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return { sent: false };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: 'hola@automatizawpp.com', name: 'AutomatizaWPP' },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: `<p>${opts.body}</p>`,
    }),
  });

  if (response.ok) {
    const data = await response.json() as { messageId?: string };
    return { sent: true, messageId: data.messageId };
  }
  return { sent: false };
}

async function sendBirdEmail(opts: { to: string; subject: string; body: string }): Promise<{ sent: boolean; messageId?: string }> {
  const apiKey = process.env.BIRD_API_KEY;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const channelId = process.env.BIRD_EMAIL_CHANNEL_ID;
  if (!apiKey || !workspaceId || !channelId) return { sent: false };

  const response = await fetch(
    `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: { contacts: [{ identifierValue: opts.to }] },
        body: {
          type: 'email',
          email: {
            subject: opts.subject,
            html: `<p>${opts.body.replace(/\n/g, '<br>')}</p>`,
          },
        },
      }),
    }
  );

  if (response.ok) {
    const data = await response.json() as { id?: string };
    return { sent: true, messageId: data.id };
  }
  return { sent: false };
}

async function sendWhatsApp(opts: { to: string; body: string }) {
  const apiKey = process.env.BIRD_API_KEY;
  if (!apiKey) return { sent: false };

  const response = await fetch(
    `https://api.bird.com/workspaces/${process.env.BIRD_WORKSPACE_ID}/channels/${process.env.BIRD_CHANNEL_ID}/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: opts.to,
        body: opts.body,
      }),
    }
  );

  return { sent: response.ok };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- _opts mantém a assinatura sendSMS({to, body}) consistente com sendEmail/sendWhatsApp; será consumido quando o provider Twilio/Bird SMS for implementado.
async function sendSMS(_opts: { to: string; body: string }) {
  // Implement Twilio or Bird SMS
  return { sent: false };
}

export async function sendOutboundMessage(options: SendOptions): Promise<OutboundDeliveryResult> {
  return routeMessage(options);
}

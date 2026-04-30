import nodemailer from 'nodemailer';

export type MailProvider = 'brevo' | 'resend' | 'smtp';

export type MailSendResult = {
  ok: boolean;
  provider: MailProvider;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plainTextToHtml(text: string) {
  return `<div>${escapeHtml(text).replace(/\r?\n/g, '<br />')}</div>`;
}

type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeRecipients(to: string | string[]) {
  return (Array.isArray(to) ? to : [to])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseFrom(value: string) {
  const match = value.match(/^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    return { name: match[1], email: match[2] };
  }
  return { name: 'AutomatizaWPP', email: value.trim() };
}

async function sendViaBrevo(input: SendMailInput, fromValue: string): Promise<MailSendResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, provider: 'brevo', error: 'BREVO_API_KEY missing' };
  }

  const sender = parseFrom(fromValue);
  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    return { ok: false, provider: 'brevo', error: 'No recipients' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { email: sender.email, name: sender.name },
        to: recipients.map((email) => ({ email })),
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, provider: 'brevo', error: `HTTP ${response.status}: ${detail.slice(0, 200)}` };
    }

    return { ok: true, provider: 'brevo' };
  } catch (error) {
    return {
      ok: false,
      provider: 'brevo',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function sendViaResend(input: SendMailInput, fromValue: string): Promise<MailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, provider: 'resend', error: 'RESEND_API_KEY missing' };
  }

  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    return { ok: false, provider: 'resend', error: 'No recipients' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromValue,
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, provider: 'resend', error: `HTTP ${response.status}: ${detail.slice(0, 200)}` };
    }

    return { ok: true, provider: 'resend' };
  } catch (error) {
    return {
      ok: false,
      provider: 'resend',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function sendViaSmtp(input: SendMailInput, fromValue: string): Promise<MailSendResult> {
  const user = process.env.SMTP_USER || process.env.ZOHO_USER;
  const pass = process.env.SMTP_PASS || process.env.ZOHO_PASS;

  if (!user || !pass) {
    return { ok: false, provider: 'smtp', error: 'SMTP credentials missing' };
  }

  const hostCandidates = unique([process.env.SMTP_HOST || 'smtp.zoho.eu', 'smtp.zoho.com']);
  const portCandidates = unique([Number(process.env.SMTP_PORT || 587), 465, 587, 2525]);
  let lastError = 'All SMTP attempts failed';

  for (const host of hostCandidates) {
    for (const port of portCandidates) {
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        auth: { user, pass }
      });

      try {
        await transport.sendMail({
          from: fromValue,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text
        });

        return { ok: true, provider: 'smtp' };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  return { ok: false, provider: 'smtp', error: lastError };
}

export async function sendSmtpMail(input: SendMailInput): Promise<MailSendResult> {
  const fromRaw = input.from || process.env.MAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_USER || 'hola@automatizawpp.com';
  const from = fromRaw.includes('<') ? fromRaw : `AutomatizaWPP <${fromRaw}>`;

  const errors: string[] = [];

  if (process.env.BREVO_API_KEY?.trim()) {
    const result = await sendViaBrevo(input, from);
    if (result.ok) return result;
    errors.push(`brevo: ${result.error}`);
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    const result = await sendViaResend(input, from);
    if (result.ok) return result;
    errors.push(`resend: ${result.error}`);
  }

  const smtpResult = await sendViaSmtp(input, from);
  if (smtpResult.ok) return smtpResult;
  errors.push(`smtp: ${smtpResult.error}`);

  return {
    ok: false,
    provider: smtpResult.provider,
    error: errors.join(' | ')
  };
}

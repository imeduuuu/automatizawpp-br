import nodemailer from 'nodemailer';

type DeliveryResult = {
  ok: boolean;
  provider: 'resend' | 'brevo' | 'smtp' | 'none';
  error?: string;
};

function emailHtml(resetLink: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#060606;padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:36px;height:36px;background:#25D366;border-radius:8px;display:inline-block;line-height:36px;text-align:center;">
                      <span style="color:#060606;font-size:20px;font-weight:900;">W</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Automatiza<span style="color:#25D366;">WPP</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0f;letter-spacing:-0.3px;">Redefinição de senha</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta AutomatizaWPP. Clique no botão abaixo para criar uma nova senha.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:8px;background:#25D366;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;color:#060606;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;">
                <a href="${resetLink}" style="font-size:12px;color:#25D366;">${resetLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;" />

              <p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">
                Este link expira em <strong style="color:#555;">24 horas</strong>. Se você não solicitou a redefinição de senha, ignore este email — sua conta continua segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #ebebeb;">
              <p style="margin:0;font-size:12px;color:#bbb;">
                © ${new Date().getFullYear()} AutomatizaWPP · automatizawpp.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(email: string, resetLink: string, fromAddress: string): Promise<DeliveryResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { ok: false, provider: 'none', error: 'RESEND_API_KEY missing' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || fromAddress,
      to: [email],
      subject: 'Redefina sua senha do AutomatizaWPP',
      html: emailHtml(resetLink)
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: 'resend',
      error: `HTTP ${response.status}: ${await response.text()}`
    };
  }

  return { ok: true, provider: 'resend' };
}

async function sendViaBrevo(email: string, resetLink: string, fromAddress: string): Promise<DeliveryResult> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey || brevoApiKey.startsWith('key_test_')) {
    return { ok: false, provider: 'none', error: 'BREVO_API_KEY not configured' };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL || fromAddress, name: 'AutomatizaWPP' },
      to: [{ email }],
      subject: 'Redefina sua senha do AutomatizaWPP',
      htmlContent: emailHtml(resetLink)
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: 'brevo',
      error: `HTTP ${response.status}: ${await response.text()}`
    };
  }

  return { ok: true, provider: 'brevo' };
}

async function sendViaSmtp(email: string, resetLink: string, fromAddress: string): Promise<DeliveryResult> {
  const user = process.env.SMTP_USER || process.env.ZOHO_USER;
  const pass = process.env.SMTP_PASS || process.env.ZOHO_PASS;

  if (!user || !pass || pass === 'change-me-in-production') {
    return { ok: false, provider: 'none', error: 'SMTP credentials not configured' };
  }

  // Usa smtp.zoho.eu (datacenter europeu) como fallback padrão
  const host = process.env.SMTP_HOST || 'smtp.zoho.eu';
  const port = Number(process.env.SMTP_PORT || 587);
  const portFallback = port === 587 ? 465 : 587;

  for (const p of [port, portFallback]) {
    const transport = nodemailer.createTransport({
      host,
      port: p,
      secure: p === 465,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 6000,
      auth: { user, pass }
    });

    try {
      await transport.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Redefina sua senha do AutomatizaWPP',
        html: emailHtml(resetLink)
      });

      return { ok: true, provider: 'smtp' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[auth] SMTP attempt failed (${host}:${p})`, message);
    }
  }

  return { ok: false, provider: 'smtp', error: 'All SMTP attempts failed' };
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<DeliveryResult> {
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || process.env.ZOHO_USER || 'hola@automatizawpp.com';

  try {
    const resend = await sendViaResend(email, resetLink, fromAddress);
    if (resend.ok) {
      return resend;
    }

    const brevo = await sendViaBrevo(email, resetLink, fromAddress);
    if (brevo.ok) {
      return brevo;
    }

    const smtp = await sendViaSmtp(email, resetLink, fromAddress);
    if (smtp.ok) {
      return smtp;
    }

    console.info('[auth] Password reset link fallback (mail delivery failed):', { email, resetLink });
    return { ok: false, provider: 'none', error: smtp.error || brevo.error || resend.error || 'Unknown mail error' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[auth] Password reset delivery failure', message);
    console.info('[auth] Password reset link fallback (exception):', { email, resetLink });
    return { ok: false, provider: 'none', error: message };
  }
}

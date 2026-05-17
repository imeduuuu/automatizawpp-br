// lib/email/template.ts — template HTML con branding AutomatizaWPP
// Usa tables + inline styles para máxima compatibilidad (Gmail/Outlook/Apple Mail)

const BRAND = {
  bg: '#060606',
  surface: '#0d0d0d',
  surface2: '#1a1a1a',
  text: '#ffffff',
  muted: '#888888',
  neon: '#25D366',
  neonDark: '#1eaf52',
  border: 'rgba(37, 211, 102, 0.18)'
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Genera el HTML completo con branding AutomatizaWPP.
 * Subject embebido como <title> (Bird/SparkPost lo usa como subject del email).
 */
export function renderBrandedEmail(opts: {
  subject: string;
  bodyHtml?: string; // HTML del cuerpo (si viene)
  bodyText?: string; // texto plano (fallback si no hay HTML)
  recipientName?: string;
}): string {
  const subject = escapeHtml(opts.subject);
  // Convertir texto plano a HTML si no hay bodyHtml
  const bodyContent = opts.bodyHtml || `<p style="margin:0 0 16px 0;">${escapeHtml(opts.bodyText || '').replace(/\n\n+/g, '</p><p style="margin:0 0 16px 0;">').replace(/\n/g, '<br>')}</p>`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};color:${BRAND.text};font-family:'Manrope','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (texto oculto que aparece en preview del inbox) -->
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${subject}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 32px;background:linear-gradient(135deg,${BRAND.surface} 0%,${BRAND.surface2} 100%);border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="display:inline-block;vertical-align:middle;">
                      <span style="display:inline-block;width:36px;height:36px;background-color:${BRAND.neon};border-radius:8px;text-align:center;line-height:36px;font-size:18px;color:#000000;font-weight:800;vertical-align:middle;">A</span>
                      <span style="display:inline-block;margin-left:10px;vertical-align:middle;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:${BRAND.text};">
                        Automatiza<span style="color:${BRAND.neon};">Wpp</span>
                      </span>
                    </div>
                  </td>
                  <td align="right" style="font-size:11px;color:${BRAND.muted};letter-spacing:0.08em;text-transform:uppercase;">
                    Automação WhatsApp · IA
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;color:${BRAND.text};">
              ${bodyContent}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent 0%,${BRAND.border} 50%,transparent 100%);"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 32px;font-size:12px;color:${BRAND.muted};line-height:1.5;">
              <p style="margin:0 0 8px 0;">
                <strong style="color:${BRAND.text};">AutomatizaWPP</strong> · Automação WhatsApp com IA para Vendas
              </p>
              <p style="margin:0 0 12px 0;">
                Responda este email para falar com nossa equipe.<br>
                <a href="https://www.automatizawpp.com" style="color:${BRAND.neon};text-decoration:none;">automatizawpp.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:${BRAND.muted};">
                © ${year} AutomatizaWPP · Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer fora do card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;margin-top:16px;">
          <tr>
            <td align="center" style="padding:8px 16px;font-size:10px;color:${BRAND.muted};">
              Este email foi enviado por inbox@automatizawpp.com
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

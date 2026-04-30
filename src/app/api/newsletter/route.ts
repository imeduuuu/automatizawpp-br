import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendSmtpMail } from '@/lib/mail';

const schema = z.object({
  email: z.string().email(),
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'eduardsmonteiro@gmail.com';

function confirmacaoHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#080808;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f0ede8;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#0a0a0a;border:1px solid #1e1e1e;border-radius:14px;padding:32px;color:#f0ede8">
  <div style="padding:8px 0 28px;border-bottom:1px solid #1e1e1e;margin-bottom:28px">
    <a href="https://automatizawpp.com" style="text-decoration:none;font-size:22px;font-weight:900;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <span style="color:#ffffff">Automatiza</span><span style="color:#25D366">WPP</span>
    </a>
  </div>
  <h1 style="margin:0 0 16px;font-size:20px;color:#fff">Bem-vindo à newsletter! ✅</h1>
  <p style="color:#aaa">Obrigado por se inscrever. A partir de agora você receberá:</p>
  <ul style="color:#aaa;line-height:1.8;padding-left:20px">
    <li>Dicas práticas de automação WhatsApp</li>
    <li>Cases reais de empresas brasileiras</li>
    <li>Tendências de IA e vendas</li>
    <li>Novidades da plataforma AutomatizaWPP</li>
  </ul>
  <p style="color:#aaa;margin-top:20px">Se quiser cancelar a qualquer momento, basta responder a este email com "cancelar".</p>
  <p style="margin:32px 0 8px;color:#f0ede8">Atenciosamente,<br><strong style="color:#fff">Equipe AutomatizaWPP</strong></p>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #1e1e1e;color:#888;font-size:12px">
    <p style="margin:0"><strong style="color:#25D366">AutomatizaWPP</strong> · automatizawpp.com · São Paulo, Brasil</p>
    <p style="margin:6px 0 0;color:#555;font-size:11px">Email inscrito: ${email}</p>
  </div>
</div>
</body>
</html>`;
}

function notificacaoAdminHtml(email: string) {
  const data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#080808;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f0ede8;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#0a0a0a;border:1px solid #1e1e1e;border-radius:14px;padding:32px;color:#f0ede8">
  <div style="padding:8px 0 28px;border-bottom:1px solid #1e1e1e;margin-bottom:28px">
    <a href="https://automatizawpp.com" style="text-decoration:none;font-size:22px;font-weight:900;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <span style="color:#ffffff">Automatiza</span><span style="color:#25D366">WPP</span>
    </a>
  </div>
  <h1 style="margin:0 0 20px;font-size:20px;color:#fff">📬 Nova inscrição na newsletter</h1>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:12px 16px;background:#111;border:1px solid #1e1e1e;border-radius:8px 8px 0 0;color:#888;font-size:13px;width:90px">Email</td>
      <td style="padding:12px 16px;background:#111;border:1px solid #1e1e1e;border-top:1px solid #1e1e1e;border-radius:0 8px 0 0;color:#25D366;font-weight:600;font-size:14px">${email}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;border-radius:0 0 0 8px;color:#888;font-size:13px">Data</td>
      <td style="padding:12px 16px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;border-radius:0 0 8px 0;color:#f0ede8;font-size:14px">${data}</td>
    </tr>
  </table>
  <p style="margin:24px 0 8px;color:#666;font-size:13px">Acesse o painel para ver todos os inscritos.</p>
  <p style="margin:32px 0 8px;color:#f0ede8">Atenciosamente,<br><strong style="color:#fff">AutomatizaWPP</strong></p>
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #1e1e1e;color:#888;font-size:12px">
    <p style="margin:0"><strong style="color:#25D366">AutomatizaWPP</strong> · automatizawpp.com · São Paulo, Brasil</p>
    <p style="margin:6px 0 0;color:#555;font-size:11px">Notificação automática do sistema</p>
  </div>
</div>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
    }

    const { email } = parsed.data;

    // Envia confirmação ao inscrito
    const confirmacao = await sendSmtpMail({
      to: email,
      subject: 'Bem-vindo à newsletter AutomatizaWPP!',
      html: confirmacaoHtml(email),
      text: `Bem-vindo à newsletter AutomatizaWPP! Você receberá dicas de automação WhatsApp, cases e tendências de IA direto no seu email.`,
    });

    // Notifica o admin
    sendSmtpMail({
      to: ADMIN_EMAIL,
      subject: `Nova inscrição na newsletter: ${email}`,
      html: notificacaoAdminHtml(email),
    }).catch(console.error);

    if (!confirmacao.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao enviar email de confirmação' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

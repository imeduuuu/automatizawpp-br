import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendSmtpMail } from '@/lib/mail';

const schema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(8),
  negocio: z.string().min(2),
  atendimentos: z.string().optional(),
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'eduardsmonteiro@gmail.com';

function notificacaoHtml(data: { nome: string; whatsapp: string; negocio: string; atendimentos?: string }) {
  const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
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
  <h1 style="margin:0 0 20px;font-size:20px;color:#fff">🎯 Novo pedido de diagnóstico</h1>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-radius:8px 8px 0 0;color:#888;font-size:12px;width:130px">Nome</td>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-radius:0 8px 0 0;color:#fff;font-weight:600;font-size:14px">${data.nome}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;color:#888;font-size:12px">WhatsApp</td>
      <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;color:#25D366;font-weight:600;font-size:14px">${data.whatsapp}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-top:none;color:#888;font-size:12px">Negócio</td>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-top:none;color:#f0ede8;font-size:14px">${data.negocio}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;color:#888;font-size:12px">Atendimentos/dia</td>
      <td style="padding:10px 14px;background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;color:#f0ede8;font-size:14px">${data.atendimentos || 'Não informado'}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-top:none;border-radius:0 0 0 8px;color:#888;font-size:12px">Recebido em</td>
      <td style="padding:10px 14px;background:#111;border:1px solid #1e1e1e;border-top:none;border-radius:0 0 8px 0;color:#f0ede8;font-size:14px">${hora}</td>
    </tr>
  </table>
  <p style="margin:24px 0 8px;color:#888;font-size:13px">Responder em até 2 horas via WhatsApp.</p>
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
      return NextResponse.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const { nome, whatsapp, negocio, atendimentos } = parsed.data;

    sendSmtpMail({
      to: ADMIN_EMAIL,
      subject: `🎯 Novo diagnóstico: ${nome} — ${negocio}`,
      html: notificacaoHtml({ nome, whatsapp, negocio, atendimentos }),
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

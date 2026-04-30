/**
 * AutomatizaWPP Email Templates Library — 20 templates em português do Brasil para funil B2B SMB.
 *
 * Cada template:
 * - key: identificador estável (não alterar após deploy)
 * - subject: assunto com interpolação {{var}}
 * - html: corpo HTML responsivo
 * - text: fallback em texto simples
 * - variables: lista de placeholders obrigatórios
 *
 * Uso:
 *   import { renderEmailTemplate } from '@/lib/email-templates';
 *   const { subject, html, text } = renderEmailTemplate('welcome', { name: 'Carlos', ... });
 *   await sendSmtpMail({ to, subject, html, text });
 */

export type EmailTemplateKey =
  | 'welcome'
  | 'first_contact'
  | 'follow_up_day3'
  | 'follow_up_day7'
  | 'demo_confirmation'
  | 'demo_reminder_24h'
  | 'demo_noshow'
  | 'trial_activation'
  | 'trial_day7_checkin'
  | 'trial_day12_lastdays'
  | 'trial_expired_recovery'
  | 'pricing_inquiry'
  | 'objection_too_expensive'
  | 'objection_not_now'
  | 'objection_need_approval'
  | 'case_study_proof'
  | 'reengagement_cold'
  | 'closing_special_offer'
  | 'won_customer_thanks'
  | 'feedback_request';

type Template = {
  key: EmailTemplateKey;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  category: 'onboarding' | 'outreach' | 'follow_up' | 'demo' | 'trial' | 'objection' | 'closing' | 'retention';
};

// Dark theme matching automatizawpp.com design system
const HEADER_HTML = `
<div style="padding:8px 0 28px;border-bottom:1px solid #1e1e1e;margin-bottom:28px">
  <a href="https://automatizawpp.com" style="text-decoration:none;display:inline-flex;align-items:center;gap:14px">
    <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#25D366" stroke-width="2.5"/>
      <path d="M11 13c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-3l-3 2.5V18h-0c-1.1 0-2-.9-2-2v-3z" fill="#ffffff"/>
    </svg>
    <span style="font-size:26px;font-weight:900;letter-spacing:0.04em;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <span style="color:#ffffff">Automatiza</span><span style="color:#25D366">WPP</span>
    </span>
  </a>
</div>
`;

const SIGNATURE_HTML = `
<p style="margin:32px 0 8px;color:#f0ede8">Atenciosamente,<br><strong style="color:#ffffff">Equipe AutomatizaWPP</strong></p>
<div style="margin-top:24px;padding-top:20px;border-top:1px solid #1e1e1e;color:#888;font-size:12px;line-height:1.6">
  <p style="margin:0 0 4px"><strong style="color:#25D366">AutomatizaWPP</strong> · Automação IA para WhatsApp e Email</p>
  <p style="margin:0"><a href="https://automatizawpp.com" style="color:#888;text-decoration:none">automatizawpp.com</a> · São Paulo, Brasil</p>
  <p style="margin:8px 0 0;color:#666;font-size:11px">Se não quiser mais receber nossos emails, <a href="https://automatizawpp.com/unsubscribe" style="color:#666">cancele sua inscrição aqui</a>.</p>
</div>
`;

const SIGNATURE_TEXT = `

Atenciosamente,
Equipe AutomatizaWPP

AutomatizaWPP · Automação IA para WhatsApp e Email
automatizawpp.com · São Paulo, Brasil`;

function wrap(content: string) {
  // Replace light-mode inline colors in content with dark-mode equivalents
  const darkContent = content
    .replace(/color:#1a1a1a/g, 'color:#f0ede8')
    .replace(/background:#f0f0f0/g, 'background:#1a1a1a')
    .replace(/background:#f0f9f0/g, 'background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.2)')
    .replace(/<code style="background:#1a1a1a;/g, '<code style="background:#1a1a1a;color:#25D366;');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#080808;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f0ede8;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#0a0a0a;border:1px solid #1e1e1e;border-radius:14px;padding:32px;color:#f0ede8">
${HEADER_HTML}
<div style="color:#f0ede8">
${darkContent}
</div>
${SIGNATURE_HTML}
</div>
</body>
</html>`;
}

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, Template> = {
  welcome: {
    key: 'welcome',
    category: 'onboarding',
    subject: 'Bem-vindo ao AutomatizaWPP, {{name}} — seu teste já está ativo',
    variables: ['name', 'businessName', 'trialEndsAt', 'password', 'appUrl'],
    html: wrap(`
<h1 style="margin:0 0 16px;font-size:22px">Olá, {{name}} 👋</h1>
<p>Bem-vindo ao AutomatizaWPP! Seu período gratuito de 14 dias para <strong>{{businessName}}</strong> já está ativo.</p>
<p><strong>Sua senha:</strong> <code style="background:#f0f0f0;padding:6px 10px;border-radius:6px;font-size:14px">{{password}}</code></p>
<p>Seu trial termina em <strong>{{trialEndsAt}}</strong>.</p>
<p style="margin:24px 0"><a href="{{appUrl}}/onboarding" style="background:#25D366;color:#054a1e;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Começar onboarding →</a></p>
<p>Se precisar de ajuda, responda a este email — lemos todas as mensagens.</p>`),
    text: `Olá, {{name}},

Bem-vindo ao AutomatizaWPP! Seu período gratuito de 14 dias para {{businessName}} já está ativo.

Sua senha: {{password}}
Seu trial termina em {{trialEndsAt}}.

Onboarding: {{appUrl}}/onboarding${SIGNATURE_TEXT}`,
  },

  first_contact: {
    key: 'first_contact',
    category: 'outreach',
    subject: '{{name}}, uma ideia para {{businessName}}',
    variables: ['name', 'businessName', 'specificObservation'],
    html: wrap(`
<h1 style="margin:0 0 16px;font-size:22px">Olá, {{name}},</h1>
<p>Vi {{specificObservation}} e achei que faria sentido entrar em contato.</p>
<p>O AutomatizaWPP ajuda negócios como <strong>{{businessName}}</strong> a automatizar as respostas do WhatsApp com IA: quando um cliente pergunta sobre horários, preços ou disponibilidade fora do horário comercial, o agente responde na hora.</p>
<p>Alguns clientes nossos estavam perdendo 40% das consultas por não responder a tempo. Com o AutomatizaWPP, esse número cai para menos de 5%.</p>
<p>Toparia uma demo de 15 min essa semana? Sem compromisso.</p>`),
    text: `Olá, {{name}},

Vi {{specificObservation}} e achei que faria sentido entrar em contato.

O AutomatizaWPP ajuda negócios como {{businessName}} a automatizar respostas do WhatsApp com IA.

Demo de 15 min essa semana?${SIGNATURE_TEXT}`,
  },

  follow_up_day3: {
    key: 'follow_up_day3',
    category: 'follow_up',
    subject: 'Posso te ajudar com algo, {{name}}?',
    variables: ['name'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Te escrevi há alguns dias sobre o AutomatizaWPP. Sei que o email pode se perder, então só queria confirmar: posso te ajudar com algo?</p>
<p>Se não for o momento agora, sem problema — é só me dizer e não te incomodo mais 😊</p>
<p>Se tiver 5 min, podemos conversar por aqui mesmo.</p>`),
    text: `Olá, {{name}},

Te escrevi há alguns dias sobre o AutomatizaWPP. Posso te ajudar com algo?

Se não for o momento, sem problema. É só me dizer.${SIGNATURE_TEXT}`,
  },

  follow_up_day7: {
    key: 'follow_up_day7',
    category: 'follow_up',
    subject: 'Último recado, {{name}}',
    variables: ['name'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Última vez que te escrevo — prometo.</p>
<p>Se o AutomatizaWPP não faz sentido pra você agora, pode ignorar este email e não receberá mais mensagens nossas.</p>
<p>Se em algum momento quiser explorar como automatizar seu WhatsApp, estamos aqui. Acesse: <a href="https://automatizawpp.com" style="color:#25D366">automatizawpp.com</a></p>`),
    text: `Olá, {{name}},

Última vez que te escrevo. Se o AutomatizaWPP não faz sentido agora, pode ignorar este email.

Quando quiser automatizar seu WhatsApp: automatizawpp.com${SIGNATURE_TEXT}`,
  },

  demo_confirmation: {
    key: 'demo_confirmation',
    category: 'demo',
    subject: 'Demo confirmada — {{demoDate}} às {{demoTime}}',
    variables: ['name', 'demoDate', 'demoTime', 'meetingUrl'],
    html: wrap(`
<h1 style="margin:0 0 16px;font-size:22px">Confirmado, {{name}}! ✅</h1>
<p>Sua demo do AutomatizaWPP:</p>
<ul>
  <li>📅 <strong>{{demoDate}}</strong></li>
  <li>🕐 <strong>{{demoTime}}</strong> (horário de Brasília)</li>
  <li>🔗 <a href="{{meetingUrl}}">Acessar a videochamada</a></li>
</ul>
<p>Duração: até 20 min. Vamos mostrar como o AutomatizaWPP responderia a um caso real do seu negócio.</p>
<p>Se algo surgir, responda a este email para reagendar.</p>`),
    text: `Demo confirmada, {{name}}.

📅 {{demoDate}}
🕐 {{demoTime}}
🔗 {{meetingUrl}}

20 min. Se precisar reagendar, responda aqui.${SIGNATURE_TEXT}`,
  },

  demo_reminder_24h: {
    key: 'demo_reminder_24h',
    category: 'demo',
    subject: 'Lembrete: sua demo AutomatizaWPP é amanhã',
    variables: ['name', 'demoTime', 'meetingUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Só um lembrete rápido — sua demo é amanhã às <strong>{{demoTime}}</strong>.</p>
<p><a href="{{meetingUrl}}" style="background:#25D366;color:#054a1e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Link para a chamada</a></p>
<p>Se quiser aproveitar melhor o tempo, tenha em mãos: uma pergunta que seu cliente costuma fazer no WhatsApp e um caso recente onde não conseguiu responder a tempo.</p>`),
    text: `Olá, {{name}},

Lembrete: demo amanhã às {{demoTime}}.
Link: {{meetingUrl}}${SIGNATURE_TEXT}`,
  },

  demo_noshow: {
    key: 'demo_noshow',
    category: 'demo',
    subject: 'Sentimos sua falta na demo, {{name}}',
    variables: ['name', 'rescheduleUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Te esperava hoje na demo, mas não conseguimos nos falar. Imagino que algo surgiu no dia.</p>
<p>Sem problema — deixo aqui o link para reagendar quando for melhor para você:</p>
<p><a href="{{rescheduleUrl}}" style="background:#25D366;color:#054a1e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reagendar demo</a></p>`),
    text: `Olá, {{name}},

Te esperava na demo hoje. Reagende quando quiser:
{{rescheduleUrl}}${SIGNATURE_TEXT}`,
  },

  trial_activation: {
    key: 'trial_activation',
    category: 'trial',
    subject: 'Seu trial do AutomatizaWPP {{plan}} está ativo',
    variables: ['name', 'plan', 'appUrl', 'trialEndsAt'],
    html: wrap(`
<h1 style="margin:0 0 16px;font-size:22px">Bora lá, {{name}}! 🚀</h1>
<p>Seu trial do plano <strong>{{plan}}</strong> está ativo. Você tem até <strong>{{trialEndsAt}}</strong> para testar tudo, sem cartão de crédito.</p>
<p><strong>O que recomendamos na primeira semana:</strong></p>
<ol>
  <li>Conectar seu WhatsApp Business (5 min)</li>
  <li>Ensinar ao bot suas 10 perguntas mais frequentes</li>
  <li>Ver o primeiro lead recuperado no seu dashboard</li>
</ol>
<p><a href="{{appUrl}}/dashboard" style="background:#25D366;color:#054a1e;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Abrir dashboard</a></p>`),
    text: `Bora lá, {{name}}!

Seu trial {{plan}} está ativo até {{trialEndsAt}}.

Recomendações para a primeira semana:
1. Conectar o WhatsApp Business
2. Ensinar as 10 perguntas frequentes
3. Ver o primeiro lead recuperado

Dashboard: {{appUrl}}/dashboard${SIGNATURE_TEXT}`,
  },

  trial_day7_checkin: {
    key: 'trial_day7_checkin',
    category: 'trial',
    subject: 'Como está indo a primeira semana, {{name}}?',
    variables: ['name', 'leadsProcessed', 'appUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Você está há 7 dias no AutomatizaWPP. Veja o que aconteceu:</p>
<p style="background:#f0f9f0;padding:14px;border-radius:8px;margin:16px 0"><strong>📊 {{leadsProcessed}} leads processados</strong> automaticamente nessa semana.</p>
<p>Quer uma chamada de 10 min para aproveitar melhor a segunda semana? Posso te mostrar os templates que melhor funcionam no seu setor.</p>
<p>Se preferir, continue testando — ainda restam 7 dias.</p>`),
    text: `Olá, {{name}},

7 dias no AutomatizaWPP. {{leadsProcessed}} leads processados.

Quer uma chamada de 10 min para otimizar a 2ª semana?${SIGNATURE_TEXT}`,
  },

  trial_day12_lastdays: {
    key: 'trial_day12_lastdays',
    category: 'trial',
    subject: 'Seu trial expira em 2 dias, {{name}}',
    variables: ['name', 'leadsProcessed', 'roiEstimate', 'appUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Faltam apenas 2 dias de teste. Nessas 2 semanas:</p>
<ul>
  <li>📨 <strong>{{leadsProcessed}} leads</strong> processados pelo bot</li>
  <li>💰 ROI estimado: <strong>{{roiEstimate}}</strong></li>
</ul>
<p>Se quiser continuar, podemos ativar seu plano hoje mesmo. Se não, sem problema — todos os seus dados ficam guardados caso decida voltar.</p>
<p><a href="{{appUrl}}/billing" style="background:#25D366;color:#054a1e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Ativar plano agora</a></p>`),
    text: `Olá, {{name}},

Seu trial expira em 2 dias.

📨 {{leadsProcessed}} leads processados
💰 ROI: {{roiEstimate}}

Ativar: {{appUrl}}/billing${SIGNATURE_TEXT}`,
  },

  trial_expired_recovery: {
    key: 'trial_expired_recovery',
    category: 'trial',
    subject: 'Seu trial expirou — mas ainda estamos aqui, {{name}}',
    variables: ['name', 'specialOfferUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Seu trial do AutomatizaWPP encerrou. Como foi a experiência?</p>
<p>Se gostou mas o momento não era o ideal, oferecemos <strong>1 mês extra grátis</strong> ao ativar qualquer plano esta semana. É a última vez que verá esta oferta.</p>
<p><a href="{{specialOfferUrl}}" style="background:#25D366;color:#054a1e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Resgatar mês grátis</a></p>
<p>Se foi um "não é pra mim", tudo bem também — obrigado por ter testado. Qualquer feedback que queira compartilhar nos ajuda muito 🙏</p>`),
    text: `Olá, {{name}},

Seu trial encerrou. Oferecemos 1 mês extra grátis ao ativar esta semana:
{{specialOfferUrl}}${SIGNATURE_TEXT}`,
  },

  pricing_inquiry: {
    key: 'pricing_inquiry',
    category: 'outreach',
    subject: 'Preços AutomatizaWPP para {{businessName}}',
    variables: ['name', 'businessName'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Obrigado por perguntar sobre os preços. Aqui vai um resumo ajustado para um negócio como <strong>{{businessName}}</strong>:</p>
<ul>
  <li><strong>Starter — R$197/mês</strong>: até 500 conversas, 1 número WhatsApp</li>
  <li><strong>Pro — R$497/mês</strong>: 2.000 conversas, automação avançada, templates com IA</li>
  <li><strong>Scale — R$997/mês</strong>: ilimitado + bundle premium (Email Scrapper, Google Reviews, ALEX supervisor)</li>
</ul>
<p>Todos incluem suporte via WhatsApp e 14 dias grátis sem cartão de crédito.</p>
<p><a href="https://automatizawpp.com/precos">Ver detalhes completos</a></p>`),
    text: `Olá, {{name}},

Preços AutomatizaWPP:
- Starter: R$197/mês (500 conversas)
- Pro: R$497/mês (2.000 conversas)
- Scale: R$997/mês (ilimitado + bundle premium)

14 dias grátis sem cartão.
Detalhes: automatizawpp.com/precos${SIGNATURE_TEXT}`,
  },

  objection_too_expensive: {
    key: 'objection_too_expensive',
    category: 'objection',
    subject: 'Sobre o preço que você mencionou, {{name}}',
    variables: ['name', 'specificMath'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Entendi o que você disse. {{specificMath}}</p>
<p>O que vejo em clientes parecidos: o investimento se paga com <strong>1 lead recuperado por mês</strong>. A média dos nossos clientes recupera de 8 a 12.</p>
<p>Minha proposta: teste 14 dias grátis. Se não recuperar pelo menos 2 leads, não cobra nada.</p>`),
    text: `Olá, {{name}},

Sobre o preço: o investimento se paga com 1 lead recuperado por mês. Média dos clientes: 8-12.

Teste 14 dias grátis. Se não recuperar 2 leads, não cobra nada.${SIGNATURE_TEXT}`,
  },

  objection_not_now: {
    key: 'objection_not_now',
    category: 'objection',
    subject: 'Sem pressa, {{name}}',
    variables: ['name'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Entendo perfeitamente. O timing é fundamental nessas decisões.</p>
<p>Que tal eu te escrever em <strong>3 meses</strong> para ver como está? Sem nenhum compromisso — só para manter o contato.</p>
<p>E se em qualquer momento decidir explorar o AutomatizaWPP antes disso, é só responder a este email.</p>`),
    text: `Olá, {{name}},

Sem pressa. Posso te escrever em 3 meses para ver como está? Sem compromisso.

Se decidir explorar antes, é só responder a este email.${SIGNATURE_TEXT}`,
  },

  objection_need_approval: {
    key: 'objection_need_approval',
    category: 'objection',
    subject: 'Material para seu gestor/sócio, {{name}}',
    variables: ['name', 'caseStudyUrl', 'roiCalculatorUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Aqui está o material que você pode compartilhar internamente:</p>
<ul>
  <li>📄 <a href="{{caseStudyUrl}}">Caso de sucesso (PDF, 2 páginas)</a></li>
  <li>🧮 <a href="{{roiCalculatorUrl}}">Calculadora de ROI</a></li>
</ul>
<p>Se precisar que eu entre na conversa com quem decide, me manda o email e a gente organiza. Sem pressão.</p>`),
    text: `Olá, {{name}},

Material para compartilhar internamente:
- Caso de sucesso: {{caseStudyUrl}}
- Calculadora ROI: {{roiCalculatorUrl}}

Se precisar que eu entre na conversa, me manda o email.${SIGNATURE_TEXT}`,
  },

  case_study_proof: {
    key: 'case_study_proof',
    category: 'outreach',
    subject: 'Como {{similarBusiness}} aumentou {{metric}} com o AutomatizaWPP',
    variables: ['name', 'similarBusiness', 'metric', 'caseStudyUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Deixo um caso que acho que vai te interessar: <strong>{{similarBusiness}}</strong> — um negócio do mesmo setor que o seu.</p>
<p>Resultado em 60 dias: <strong>{{metric}}</strong>.</p>
<p><a href="{{caseStudyUrl}}">Ler caso completo (3 min)</a></p>
<p>Se quiser replicar algo parecido, me conta e te explico por onde começaram.</p>`),
    text: `Olá, {{name}},

Caso: {{similarBusiness}} aumentou {{metric}} em 60 dias com o AutomatizaWPP.
{{caseStudyUrl}}${SIGNATURE_TEXT}`,
  },

  reengagement_cold: {
    key: 'reengagement_cold',
    category: 'retention',
    subject: 'Você ainda está por aí, {{name}}?',
    variables: ['name', 'newFeature'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Faz um tempo que não te escrevemos. Três novidades que talvez você não conheça:</p>
<p><strong>{{newFeature}}</strong></p>
<p>Se a ideia de automatizar o WhatsApp voltou ao seu radar, estamos aqui.</p>`),
    text: `Olá, {{name}},

Faz um tempo. Novidade: {{newFeature}}

Se a ideia de automatizar o WhatsApp voltou ao seu radar, estamos aqui.${SIGNATURE_TEXT}`,
  },

  closing_special_offer: {
    key: 'closing_special_offer',
    category: 'closing',
    subject: 'Oferta especial: 25% off no AutomatizaWPP {{plan}} (3 dias)',
    variables: ['name', 'plan', 'discountUrl', 'expiresAt'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Queria te fazer uma proposta concreta: <strong>25% de desconto</strong> no primeiro trimestre do plano {{plan}}.</p>
<p>Válido até <strong>{{expiresAt}}</strong>. Não é uma promoção pública — é para clientes que já conhecemos.</p>
<p><a href="{{discountUrl}}" style="background:#25D366;color:#054a1e;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Ativar com 25% off</a></p>`),
    text: `Olá, {{name}},

25% de desconto no {{plan}} no primeiro trimestre. Válido até {{expiresAt}}.
{{discountUrl}}${SIGNATURE_TEXT}`,
  },

  won_customer_thanks: {
    key: 'won_customer_thanks',
    category: 'onboarding',
    subject: 'Obrigado por se juntar a nós, {{name}}! 🎉',
    variables: ['name', 'plan', 'onboardingCallUrl'],
    html: wrap(`
<h1 style="margin:0 0 16px;font-size:22px">Bem-vindo à família AutomatizaWPP! 🎉</h1>
<p>{{name}}, muito obrigado por confiar em nós com o plano <strong>{{plan}}</strong>.</p>
<p>Próximos passos:</p>
<ol>
  <li><strong>Chamada de onboarding (30 min)</strong>: <a href="{{onboardingCallUrl}}">reservar horário</a></li>
  <li>Atribuição do seu account manager pessoal</li>
  <li>Templates premium ativados na sua conta ainda hoje</li>
</ol>
<p>Qualquer coisa, meu WhatsApp direto está na minha assinatura. Respondo em menos de 1h no horário comercial.</p>`),
    text: `Bem-vindo, {{name}}! 🎉

Muito obrigado por confiar no AutomatizaWPP {{plan}}.

Próximos passos:
1. Reservar onboarding: {{onboardingCallUrl}}
2. Account manager atribuído
3. Templates premium ativos hoje${SIGNATURE_TEXT}`,
  },

  feedback_request: {
    key: 'feedback_request',
    category: 'retention',
    subject: '2 min para nos ajudar a melhorar o AutomatizaWPP, {{name}}?',
    variables: ['name', 'surveyUrl'],
    html: wrap(`
<p>Olá, {{name}},</p>
<p>Você está há um tempo com o AutomatizaWPP e sua opinião vale mais do que qualquer benchmark.</p>
<p>Tem 2 minutos para responder 5 perguntas? Isso nos ajuda a priorizar o que construímos.</p>
<p><a href="{{surveyUrl}}" style="background:#25D366;color:#054a1e;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Responder pesquisa (2 min)</a></p>
<p>Se preferir, pode simplesmente responder a este email com um comentário livre — também funciona 🙏</p>`),
    text: `Olá, {{name}},

2 min para responder 5 perguntas? Isso nos ajuda a priorizar o que construímos.
{{surveyUrl}}${SIGNATURE_TEXT}`,
  },
};

/**
 * Render a template by key, interpolating {{var}} placeholders.
 * Throws if any required variable is missing.
 */
export function renderEmailTemplate(
  key: EmailTemplateKey,
  vars: Record<string, string>,
): { subject: string; html: string; text: string } {
  const template = EMAIL_TEMPLATES[key];
  if (!template) throw new Error(`Unknown email template: ${key}`);

  for (const required of template.variables) {
    if (!(required in vars)) {
      throw new Error(`Missing variable "${required}" for template "${key}"`);
    }
  }

  const interpolate = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? '');

  return {
    subject: interpolate(template.subject),
    html: interpolate(template.html),
    text: interpolate(template.text),
  };
}

/**
 * List templates filtered by category for the UI.
 */
export function listTemplatesByCategory(category?: Template['category']) {
  const all = Object.values(EMAIL_TEMPLATES);
  return category ? all.filter((t) => t.category === category) : all;
}

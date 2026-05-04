import { Prisma } from '@prisma/client';
import { anthropicClient } from '@/lib/ai/anthropic-client';
import { logAuditEvent } from '@/lib/audit';
import { prisma } from '@/lib/db';
import type {
  AlexMonitorPayload,
  AlexRecommendation,
  AlexWeeklyReport,
  BundleServiceAccess,
  EmailScrapperResult,
  EmailScrapperStats,
  GoogleReviewData,
  GoogleReviewsStats,
  IcebreakerResult,
  IcebreakerStats
} from '@/lib/scale-bundle/types';

type JsonRecord = Record<string, unknown>;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function extractList(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [] as unknown[];
}

function emailRegexValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emailDomain(email: string) {
  return email.includes('@') ? email.split('@')[1] ?? '' : '';
}

function n8nHeaders() {
  const apiKey = process.env.N8N_API_KEY?.trim();
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-N8N-Key': apiKey } : {})
  };
}

function getWebhookUrl(explicitKey: string, fallbackPath: string) {
  const explicit = process.env[explicitKey]?.trim();
  if (explicit) {
    return explicit;
  }

  const base = process.env.N8N_URL?.trim()?.replace(/\/$/, '');
  if (!base) {
    return '';
  }

  return `${base}/webhook/${fallbackPath}`;
}

async function postWebhook(url: string, payload: JsonRecord) {
  if (!url) {
    throw new Error('Webhook no configurado. Revisa las variables N8N_URL o SCALE_*_WEBHOOK.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: n8nHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook respondio ${response.status}: ${body || 'sin detalle'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as JsonRecord;
  }

  return { raw: await response.text() } satisfies JsonRecord;
}

async function logBundleActivity(params: {
  access: BundleServiceAccess;
  event: string;
  summary: string;
  metadata: JsonRecord;
}) {
  await Promise.all([
    prisma.serviceActivity.create({
      data: {
        userId: params.access.userId,
        serviceId: params.access.serviceId,
        accessId: params.access.accessId,
        event: params.event,
        summary: params.summary,
        metadata: params.metadata as Prisma.InputJsonValue
      }
    }),
    logAuditEvent({
      event: params.event,
      userId: params.access.userId,
      workspaceId: params.access.workspaceId,
      metadata: {
        serviceSlug: params.access.serviceSlug,
        ...params.metadata
      }
    })
  ]);
}

async function getRecentActivity(access: BundleServiceAccess, event: string, take = 30) {
  return prisma.serviceActivity.findMany({
    where: {
      userId: access.userId,
      serviceId: access.serviceId,
      event
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      metadata: true,
      createdAt: true
    }
  });
}

function buildWeekLabel() {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString('pt-BR')} - ${sunday.toLocaleDateString('pt-BR')}`;
}

function normalizeEmailResults(payload: JsonRecord): EmailScrapperResult[] {
  const mapped: Array<EmailScrapperResult | null> = extractList(payload, ['emails', 'results', 'data'])
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          email: entry,
          isValid: emailRegexValid(entry),
          domain: emailDomain(entry),
          companyName: null,
          confidence: 75
        } satisfies EmailScrapperResult;
      }

      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const value = entry as JsonRecord;
      const email = safeString(value.email || value.address || value.primaryEmail);
      if (!email) {
        return null;
      }

      return {
        email,
        isValid: typeof value.isValid === 'boolean' ? value.isValid : emailRegexValid(email),
        domain: safeString(value.domain) || emailDomain(email),
        companyName: safeString(value.companyName || value.company) || null,
        confidence: Math.max(0, Math.min(100, safeNumber(value.confidence, 75)))
      } satisfies EmailScrapperResult;
    });

  return mapped.filter((entry): entry is EmailScrapperResult => Boolean(entry));
}

export async function runEmailScrapper(access: BundleServiceAccess, input: { domain: string; maxResults?: number }) {
  const payload = await postWebhook(getWebhookUrl('SCALE_EMAIL_SCRAPPER_WEBHOOK', 'email-scrapper'), {
    domain: input.domain,
    maxResults: input.maxResults ?? 100
  });

  const emails = normalizeEmailResults(payload);
  const qualified = emails.filter((entry) => entry.isValid && entry.confidence >= 70).length;
  const validationRate = emails.length > 0 ? clampPercent((qualified / emails.length) * 100) : 0;
  const costPerLead = safeNumber(payload.costPerLead, 0);

  await logBundleActivity({
    access,
    event: 'SCALE_EMAIL_SCRAPPER_RUN',
    summary: `Email Scrapper proceso ${emails.length} emails para ${input.domain}`,
    metadata: {
      domain: input.domain,
      maxResults: input.maxResults ?? 100,
      count: emails.length,
      qualified,
      validationRate,
      costPerLead
    }
  });

  return {
    count: emails.length,
    qualified,
    validationRate,
    costPerLead,
    emails
  };
}

export async function getEmailScrapperStats(access: BundleServiceAccess): Promise<EmailScrapperStats> {
  const activities = await getRecentActivity(access, 'SCALE_EMAIL_SCRAPPER_RUN');

  let count = 0;
  let qualified = 0;
  let weightedCost = 0;
  let costSamples = 0;

  for (const activity of activities) {
    const metadata = (activity.metadata as JsonRecord | null) ?? {};
    count += safeNumber(metadata.count);
    qualified += safeNumber(metadata.qualified);
    if (safeNumber(metadata.costPerLead) > 0) {
      weightedCost += safeNumber(metadata.costPerLead);
      costSamples += 1;
    }
  }

  return {
    count,
    qualified,
    validationRate: count > 0 ? clampPercent((qualified / count) * 100) : 0,
    costPerLead: costSamples > 0 ? Math.round((weightedCost / costSamples) * 100) / 100 : 0,
    lastRunAt: activities[0]?.createdAt.toISOString() ?? null
  };
}

function normalizeGoogleReviews(payload: JsonRecord): GoogleReviewData[] {
  const mapped: Array<GoogleReviewData | null> = extractList(payload, ['results', 'reviews', 'data'])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const value = entry as JsonRecord;
      const reviewId = safeString(value.reviewId || value.id);
      if (!reviewId) {
        return null;
      }

      return {
        reviewId,
        authorName: safeString(value.authorName || value.author || value.customerName) || 'Cliente',
        rating: Math.round(safeNumber(value.rating, 5)),
        replyGenerated: safeString(value.replyGenerated || value.reply || value.generatedReply),
        replyPublished: typeof value.replyPublished === 'boolean' ? value.replyPublished : Boolean(value.hasReply)
      } satisfies GoogleReviewData;
    });

  return mapped.filter((entry): entry is GoogleReviewData => Boolean(entry));
}

export async function runGoogleReviews(access: BundleServiceAccess, input: { businessId: string }) {
  const payload = await postWebhook(getWebhookUrl('SCALE_GOOGLE_REVIEWS_WEBHOOK', 'google-reviews'), {
    businessId: input.businessId
  });

  const results = normalizeGoogleReviews(payload);
  const newReviews = safeNumber(payload.new, results.length);
  const replied = safeNumber(payload.replied, results.filter((entry) => entry.replyPublished).length);
  const replyRate = newReviews > 0 ? clampPercent((replied / newReviews) * 100) : 0;
  const ratingChange = safeNumber(payload.ratingChange, 0);

  await logBundleActivity({
    access,
    event: 'SCALE_GOOGLE_REVIEWS_SYNC',
    summary: `Google Reviews sincronizo ${newReviews} reseñas y respondio ${replied}`,
    metadata: {
      businessId: input.businessId,
      new: newReviews,
      replied,
      replyRate,
      ratingChange
    }
  });

  return {
    new: newReviews,
    replied,
    replyRate,
    ratingChange,
    results
  };
}

export async function getGoogleReviewsStats(access: BundleServiceAccess): Promise<GoogleReviewsStats> {
  const activities = await getRecentActivity(access, 'SCALE_GOOGLE_REVIEWS_SYNC');

  let totalNew = 0;
  let totalReplied = 0;
  let ratingChange = 0;

  for (const activity of activities) {
    const metadata = (activity.metadata as JsonRecord | null) ?? {};
    totalNew += safeNumber(metadata.new);
    totalReplied += safeNumber(metadata.replied);
    ratingChange += safeNumber(metadata.ratingChange);
  }

  return {
    new: totalNew,
    replied: totalReplied,
    replyRate: totalNew > 0 ? clampPercent((totalReplied / totalNew) * 100) : 0,
    ratingChange: Math.round(ratingChange * 100) / 100,
    lastRunAt: activities[0]?.createdAt.toISOString() ?? null
  };
}

function normalizeIcebreakerResult(payload: JsonRecord, fallbackProspect: { name: string; email: string; company?: string }) {
  const result = (payload.result && typeof payload.result === 'object' ? payload.result : payload) as JsonRecord;
  return {
    prospectId: safeString(result.prospectId || result.id) || fallbackProspect.email,
    prospectName: safeString(result.prospectName || result.name) || fallbackProspect.name,
    messageGenerated: safeString(result.messageGenerated || result.message || result.copy),
    messageSent: typeof result.messageSent === 'boolean' ? result.messageSent : Boolean(result.sent ?? true)
  } satisfies IcebreakerResult;
}

export async function runIcebreaker(
  access: BundleServiceAccess,
  input: { prospect: { name: string; email: string; company?: string }; channel?: 'email' | 'linkedin' }
) {
  const payload = await postWebhook(getWebhookUrl('SCALE_ICEBREAKER_WEBHOOK', 'icebreaker-send'), {
    prospect: input.prospect,
    channel: input.channel || 'email'
  });

  const result = normalizeIcebreakerResult(payload, input.prospect);
  const sent = safeNumber(payload.sent, result.messageSent ? 1 : 0);
  const responses = safeNumber(payload.responses, 0);
  const conversions = safeNumber(payload.conversions, 0);
  const revenue = safeNumber(payload.revenue, 0);
  const responseRate = sent > 0 ? clampPercent((responses / sent) * 100) : safeNumber(payload.responseRate, 0);

  await logBundleActivity({
    access,
    event: 'SCALE_ICEBREAKER_RUN',
    summary: `Icebreaker lanzo outreach para ${input.prospect.email}`,
    metadata: {
      prospectEmail: input.prospect.email,
      prospectName: input.prospect.name,
      company: input.prospect.company || '',
      channel: input.channel || 'email',
      sent,
      responses,
      responseRate,
      conversions,
      revenue
    }
  });

  return {
    result,
    sent,
    responses,
    responseRate,
    conversions,
    revenue
  };
}

export async function getIcebreakerStats(access: BundleServiceAccess): Promise<IcebreakerStats> {
  const activities = await getRecentActivity(access, 'SCALE_ICEBREAKER_RUN');

  let sent = 0;
  let responses = 0;
  let conversions = 0;
  let revenue = 0;

  for (const activity of activities) {
    const metadata = (activity.metadata as JsonRecord | null) ?? {};
    sent += safeNumber(metadata.sent);
    responses += safeNumber(metadata.responses);
    conversions += safeNumber(metadata.conversions);
    revenue += safeNumber(metadata.revenue);
  }

  return {
    sent,
    responses,
    responseRate: sent > 0 ? clampPercent((responses / sent) * 100) : 0,
    conversions,
    revenue: Math.round(revenue * 100) / 100,
    lastRunAt: activities[0]?.createdAt.toISOString() ?? null
  };
}

function buildRecommendations(emailStats: EmailScrapperStats, reviewStats: GoogleReviewsStats, icebreakerStats: IcebreakerStats): AlexRecommendation[] {
  const recommendations: AlexRecommendation[] = [];

  if (emailStats.count > 0 && emailStats.validationRate < 75) {
    recommendations.push({
      agentType: 'email-scrapper',
      title: 'Sube la calidad del scrapping',
      description: `La validacion esta en ${emailStats.validationRate}%. Conviene afinar fuentes o filtros antes de escalar outreach.`,
      impactEstimate: 'alto',
      autoExecutable: false
    });
  }

  if (reviewStats.new > 0 && reviewStats.replyRate < 85) {
    recommendations.push({
      agentType: 'google-reviews',
      title: 'Hay reseñas sin responder',
      description: `Solo se esta respondiendo el ${reviewStats.replyRate}% de reseñas nuevas. Conviene aumentar la cadencia de sincronizacion.`,
      impactEstimate: 'medio',
      autoExecutable: true
    });
  }

  if (icebreakerStats.sent > 0 && icebreakerStats.responseRate < 25) {
    recommendations.push({
      agentType: 'icebreaker',
      title: 'La tasa de respuesta es baja',
      description: `Icebreaker esta en ${icebreakerStats.responseRate}% de respuesta. Prueba un angulo mas especifico por vertical o CTA menos agresivo.`,
      impactEstimate: 'alto',
      autoExecutable: false
    });
  }

  return recommendations;
}

export async function generateAlexWeeklyReport(params: {
  alexAccess: BundleServiceAccess;
  emailAccess: BundleServiceAccess;
  reviewsAccess: BundleServiceAccess;
  icebreakerAccess: BundleServiceAccess;
  persist?: boolean;
}): Promise<AlexWeeklyReport> {
  const { alexAccess, emailAccess, reviewsAccess, icebreakerAccess } = params;
  const [emailStats, reviewStats, icebreakerStats] = await Promise.all([
    getEmailScrapperStats(emailAccess),
    getGoogleReviewsStats(reviewsAccess),
    getIcebreakerStats(icebreakerAccess)
  ]);
  const recommendations = buildRecommendations(emailStats, reviewStats, icebreakerStats);
  const summaryText =
    recommendations.length > 0
      ? `ALEX detecta ${recommendations.length} frente${recommendations.length > 1 ? 's' : ''} prioritario${recommendations.length > 1 ? 's' : ''}: ${recommendations
          .map((item) => item.title)
          .join(', ')}.`
      : 'ALEX no detecta cuellos de botella criticos esta semana. El bundle se mantiene estable.';

  const report: AlexWeeklyReport = {
    week: buildWeekLabel(),
    emailStats: {
      count: emailStats.count,
      qualified: emailStats.qualified,
      costPerLead: emailStats.costPerLead
    },
    reviewsStats: {
      new: reviewStats.new,
      replied: reviewStats.replied,
      ratingChange: reviewStats.ratingChange
    },
    icebreakerStats: {
      sent: icebreakerStats.sent,
      responses: icebreakerStats.responses,
      responseRate: icebreakerStats.responseRate
    },
    recommendations,
    summaryText
  };

  if (params.persist) {
    const content = [
      `# Reporte semanal ALEX`,
      '',
      `Semana: ${report.week}`,
      '',
      `## Resumen`,
      report.summaryText,
      '',
      `## Email Scrapper`,
      `- Emails procesados: ${report.emailStats.count}`,
      `- Leads cualificados: ${report.emailStats.qualified}`,
      `- Coste por lead: ${report.emailStats.costPerLead}`,
      '',
      `## Google Reviews`,
      `- Reviews nuevas: ${report.reviewsStats.new}`,
      `- Reviews respondidas: ${report.reviewsStats.replied}`,
      `- Variacion rating: ${report.reviewsStats.ratingChange}`,
      '',
      `## Icebreaker`,
      `- Mensajes enviados: ${report.icebreakerStats.sent}`,
      `- Respuestas: ${report.icebreakerStats.responses}`,
      `- Tasa de respuesta: ${report.icebreakerStats.responseRate}%`,
      '',
      `## Recomendaciones`,
      ...(report.recommendations.length > 0
        ? report.recommendations.map((item) => `- ${item.title}: ${item.description}`)
        : ['- Sin recomendaciones criticas esta semana.'])
    ].join('\n');

    await Promise.all([
      prisma.serviceResource.create({
        data: {
          serviceId: alexAccess.serviceId,
          accessId: alexAccess.accessId,
          title: `Reporte ALEX ${report.week}`,
          resourceType: 'alex-weekly-report',
          content,
          isClientVisible: true
        }
      }),
      logBundleActivity({
        access: alexAccess,
        event: 'SCALE_ALEX_REPORT',
        summary: `ALEX genero el reporte semanal ${report.week}`,
        metadata: report as unknown as JsonRecord
      })
    ]);
  }

  return report;
}

async function getLatestAlexReport(access: BundleServiceAccess) {
  const resource = await prisma.serviceResource.findFirst({
    where: {
      serviceId: access.serviceId,
      accessId: access.accessId,
      resourceType: 'alex-weekly-report'
    },
    orderBy: { createdAt: 'desc' },
    select: {
      content: true
    }
  });

  return resource?.content ?? null;
}

export async function monitorAlexBundle(params: {
  alexAccess: BundleServiceAccess;
  emailAccess: BundleServiceAccess;
  reviewsAccess: BundleServiceAccess;
  icebreakerAccess: BundleServiceAccess;
}): Promise<AlexMonitorPayload> {
  const [emailStats, reviewStats, icebreakerStats, latestReport] = await Promise.all([
    getEmailScrapperStats(params.emailAccess),
    getGoogleReviewsStats(params.reviewsAccess),
    getIcebreakerStats(params.icebreakerAccess),
    getLatestAlexReport(params.alexAccess)
  ]);

  const alerts: string[] = [];
  if (emailStats.count === 0) alerts.push('Email Scrapper aun no se ha ejecutado.');
  if (reviewStats.new > 0 && reviewStats.replied === 0) alerts.push('Hay reseñas nuevas sin respuesta.');
  if (icebreakerStats.sent === 0) alerts.push('Icebreaker aun no ha lanzado outreach.');

  const recommendations = buildRecommendations(emailStats, reviewStats, icebreakerStats);
  const weeklyReport = latestReport
    ? await generateAlexWeeklyReport({
        alexAccess: params.alexAccess,
        emailAccess: params.emailAccess,
        reviewsAccess: params.reviewsAccess,
        icebreakerAccess: params.icebreakerAccess,
        persist: false
      })
    : null;

  return {
    status: alerts.length >= 2 ? 'error' : alerts.length > 0 || recommendations.length > 0 ? 'warning' : 'healthy',
    alerts,
    recommendations,
    weeklyReport
  };
}

function fallbackAlexReply(message: string, report: AlexWeeklyReport) {
  const normalized = message.toLowerCase();

  if (normalized.includes('email')) {
    return `Email Scrapper lleva ${report.emailStats.count} emails procesados y ${report.emailStats.qualified} cualificados. Si quieres subir el volumen, revisa primero la tasa de validacion.`;
  }

  if (normalized.includes('review') || normalized.includes('reseña')) {
    return `Google Reviews ha visto ${report.reviewsStats.new} reseñas nuevas y ha respondido ${report.reviewsStats.replied}. El siguiente foco es mantener la tasa de respuesta por encima del 85%.`;
  }

  if (normalized.includes('ice') || normalized.includes('mensaje') || normalized.includes('outreach')) {
    return `Icebreaker ha enviado ${report.icebreakerStats.sent} mensajes y va en ${report.icebreakerStats.responseRate}% de respuesta. Si cae por debajo del 25%, cambia angulo y CTA.`;
  }

  if (report.recommendations.length > 0) {
    const top = report.recommendations[0];
    return `${top.title}: ${top.description}`;
  }

  return `Ahora mismo el bundle esta estable. Mi lectura es: ${report.summaryText}`;
}

export async function chatWithAlexBundle(params: {
  alexAccess: BundleServiceAccess;
  emailAccess: BundleServiceAccess;
  reviewsAccess: BundleServiceAccess;
  icebreakerAccess: BundleServiceAccess;
  message: string;
}) {
  const report = await generateAlexWeeklyReport({
    alexAccess: params.alexAccess,
    emailAccess: params.emailAccess,
    reviewsAccess: params.reviewsAccess,
    icebreakerAccess: params.icebreakerAccess,
    persist: false
  });

  let reply = fallbackAlexReply(params.message, report);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await anthropicClient.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Eres ALEX Supervisor de AutomatizaWPP. Responde en espanol, corto y accionable. Usa el contexto operativo del bundle Scale y evita inventar datos.

Reporte actual: ${JSON.stringify(report)}

Pregunta del usuario: ${params.message}`
          }
        ]
      });

      const content = response.content[0];
      if (content?.type === 'text' && content.text?.trim()) {
        reply = content.text.trim();
      }
    } catch (error) {
      console.warn('[scale-bundle] alex chat fallback', error);
    }
  }

  await logBundleActivity({
    access: params.alexAccess,
    event: 'SCALE_ALEX_CHAT',
    summary: 'ALEX respondio una consulta operativa del bundle Scale',
    metadata: {
      message: params.message,
      reply
    }
  });

  return reply;
}

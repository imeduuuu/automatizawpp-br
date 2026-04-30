import { NextResponse } from 'next/server';
import { AgentName, LeadStatus, IntentLevel } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * POST /api/agents/seed-training — populates DB with fake Spanish SMB leads
 * + conversations + messages so agents have real data structures to train on.
 *
 * All data is FICTITIOUS — names, emails, phones, addresses are made up.
 *
 * Auth: header `x-cron-secret` must match env CRON_SECRET.
 */

const FAKE_LEADS = [
  { fullName: 'Carmen Ruiz García', email: 'c.ruiz@restaurantela-paloma.demo', phone: '+34680365779', company: 'Restaurante La Paloma', sector: 'Restaurante', city: 'Barcelona', problem: 'Reservas no se confirman, perdemos clientes' },
  { fullName: 'Javier Moreno Sanz', email: 'j.moreno@clinicasolmar.demo', phone: '+34680365779', company: 'Clínica SolMar Dental', sector: 'Clínica/Salud', city: 'Madrid', problem: 'Cancelaciones último minuto sin reposición' },
  { fullName: 'Laura Vega Pérez', email: 'laura@peluqueriavanity.demo', phone: '+34680365779', company: 'Peluquería Vanity', sector: 'Peluquería', city: 'Valencia', problem: 'WhatsApp saturado, no puedo responder a todo' },
  { fullName: 'Miguel Torres Romero', email: 'mtorres@inmovel.demo', phone: '+34680365779', company: 'Inmobiliaria Velasco', sector: 'Inmobiliaria', city: 'Sevilla', problem: 'Leads se enfrían, no hay seguimiento sistemático' },
  { fullName: 'Ana Martínez Soler', email: 'ana@tiendamoda.demo', phone: '+34680365779', company: 'Tienda Moda Anita', sector: 'Ecommerce', city: 'Bilbao', problem: 'Carritos abandonados, no recupero ventas' },
  { fullName: 'Roberto Castillo Vidal', email: 'r.castillo@bistromar.demo', phone: '+34680365779', company: 'Bistro Mar', sector: 'Restaurante', city: 'Barcelona', problem: 'No tengo tiempo para responder reservas en horario punta' },
  { fullName: 'Patricia Núñez Benítez', email: 'pnunez@dentalclinic.demo', phone: '+34680365779', company: 'Dental Clinic Núñez', sector: 'Clínica/Salud', city: 'Málaga', problem: 'Recordatorios de cita los manda mi recepcionista a mano' },
  { fullName: 'Daniel Herrera López', email: 'daniel@barberia-h.demo', phone: '+34680365779', company: 'Barbería Herrera', sector: 'Peluquería', city: 'Zaragoza', problem: 'Cita online no funciona en móvil, pierdo clientes jóvenes' },
  { fullName: 'Elena Romero Vázquez', email: 'eromero@viviendasur.demo', phone: '+34680365779', company: 'Viviendas Sur', sector: 'Inmobiliaria', city: 'Granada', problem: 'Demasiados leads basura sin filtrar' },
  { fullName: 'Carlos Méndez Fuentes', email: 'cmendez@gourmet.demo', phone: '+34680365779', company: 'Gourmet Online', sector: 'Ecommerce', city: 'Murcia', problem: 'Campañas email open rate bajo, no destacan' },
  { fullName: 'Sofía Ortiz Marín', email: 'sortiz@tabernaveronica.demo', phone: '+34680365779', company: 'Taberna Verónica', sector: 'Restaurante', city: 'Toledo', problem: 'WhatsApp del trabajo y personal mezclados, caos' },
  { fullName: 'Andrés Gil Rodríguez', email: 'agil@fisiocenter.demo', phone: '+34680365779', company: 'FisioCenter Andrés', sector: 'Clínica/Salud', city: 'Valladolid', problem: 'Pacientes no asisten y no avisan, agenda perdida' },
  { fullName: 'Marta Jiménez Cano', email: 'mjimenez@beautyloft.demo', phone: '+34680365779', company: 'Beauty Loft', sector: 'Peluquería', city: 'Alicante', problem: 'Quiero promocionar productos pero no tengo email marketing' },
  { fullName: 'Pablo Serrano Díaz', email: 'pserrano@invermadrid.demo', phone: '+34680365779', company: 'Inversiones Madrid', sector: 'Inmobiliaria', city: 'Madrid', problem: 'Necesito calificar leads antes de llamar, perdiendo tiempo' },
  { fullName: 'Beatriz Lara Morales', email: 'blara@modaonline.demo', phone: '+34680365779', company: 'BLM Moda Online', sector: 'Ecommerce', city: 'Barcelona', problem: 'Customer service tarda 24h en responder, churn alto' },
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SAMPLE_INBOUND_MESSAGES = [
  'Hola, vi vuestro anuncio. ¿Tenéis disponibilidad esta semana?',
  'Buenas, me interesa el servicio. ¿Cuánto cuesta el plan básico?',
  'Hola! Una amiga me recomendó. ¿Podemos hablar mañana?',
  'Qué tal, necesito información sobre cómo funciona.',
  'Buenas tardes, tengo dudas sobre el contrato.',
  'Hola, ¿hacéis demo gratis?',
  'Me han dicho que automatizáis WhatsApp, ¿es así?',
];

const SAMPLE_AGENT_REPLIES = [
  'Hola! Encantada de saludarte. Te llamo en 5 min para conocerte mejor.',
  'Perfecto, tenemos disponibilidad. ¿Qué día te viene bien?',
  'Sí! Plan inicial R$197/mês. Te envío detalle por email.',
  'Claro, demo gratis 30 días. ¿Empezamos hoy?',
  'Por supuesto, te explico todo. ¿Qué número usáis ya?',
];

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Pick the first workspace (AutomatizaWPP internal) to seed against
    const workspace = await prisma.workspace.findFirst({ select: { id: true } });
    if (!workspace) {
      return NextResponse.json({ ok: false, error: 'No workspace exists' }, { status: 400 });
    }

    const created = { leads: 0, conversations: 0, messages: 0, agentRuns: 0 };

    for (const data of FAKE_LEADS) {
    const existing = await prisma.lead.findFirst({
      where: { workspaceId: workspace.id, email: data.email },
      select: { id: true },
    });
    if (existing) continue;

    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        productInterest: data.sector,
        source: 'TRAINING_SEED',
        status: pickOne<LeadStatus>([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.NURTURING]),
        intentLevel: pickOne<IntentLevel>([IntentLevel.LOW, IntentLevel.MEDIUM, IntentLevel.HIGH]),
      },
    });
    created.leads++;

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        channel: 'WHATSAPP',
        isClosed: false,
      },
    });
    created.conversations++;

    const numMessages = randomBetween(2, 5);
    for (let i = 0; i < numMessages; i++) {
      const isInbound = i % 2 === 0;
      await prisma.message.create({
        data: {
          leadId: lead.id,
          conversationId: conversation.id,
          channel: 'WHATSAPP',
          direction: isInbound ? 'INBOUND' : 'OUTBOUND',
          body: isInbound ? pickOne(SAMPLE_INBOUND_MESSAGES) : pickOne(SAMPLE_AGENT_REPLIES),
          createdAt: new Date(Date.now() - randomBetween(1, 7) * 24 * 60 * 60 * 1000 + i * 60_000),
        },
      });
      created.messages++;
    }

    // Spawn synthetic AgentRuns: one per agent per lead, status COMPLETED
    const agentTypes = Object.values(AgentName);
    for (const agent of agentTypes) {
      const startedAt = new Date(Date.now() - randomBetween(1, 24) * 60 * 60 * 1000);
      const endedAt = new Date(startedAt.getTime() + randomBetween(2, 30) * 1000);
      await prisma.agentRun.create({
        data: {
          workspaceId: workspace.id,
          leadId: lead.id,
          agent,
          status: 'COMPLETED',
          startedAt,
          endedAt,
          inputPayload: {
            type: 'TRAINING',
            leadProblem: data.problem,
            leadStatus: lead.status,
          },
          outputPayload: {
            ok: true,
            simulated: true,
            agent,
            note: 'Synthetic training run',
          },
        },
      });
      created.agentRuns++;
    }
  }

    return NextResponse.json({
      ok: true,
      workspace: workspace.id,
      created,
      note: 'Synthetic training data seeded. Agents now have leads + conversations + runs.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

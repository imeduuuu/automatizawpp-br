import { NextRequest, NextResponse } from 'next/server';
import { runOrchestratorAgent } from '@/lib/agents/orchestrator';
import { LeadResponseAgent } from '@/lib/agents/lead-response-agent';
import { ObjectionHandlingAgent } from '@/lib/agents/objection-agent';
import { CloserAgent } from '@/lib/agents/closer-agent';
import { FollowUpAgent } from '@/lib/agents/followup-agent';
import { runQualificationAgent } from '@/lib/agents/qualification';
import { SalesQaAgent } from '@/lib/agents/qa-agent';
import { AgentContext } from '@/lib/agents/contracts';
import { AgentName } from '@/lib/types';
import { prisma } from '@/lib/db';
import { normalizeBirdEvent } from '@/lib/channels/bird-normalizer';
import { routeMessage } from '@/lib/channels/router';
import { detectLanguage, detectLanguageHeuristic } from '@/lib/agents/language-detector';
import {
  triggerEscalation,
  triggerLeadCreated,
  triggerHighIntentLead,
  triggerEmailFailed,
  triggerSystemError,
} from '@/lib/notifications/triggers';

// Sprint 2.4-C V.L.A.E.G. — Acciones outbound del orchestrator que generan
// draft + QA + envío. ESCALATE/HOLD/QUALIFY tienen flujo propio.
type DraftAction = 'RESPOND' | 'HANDLE_OBJECTION' | 'CLOSE' | 'FOLLOW_UP';

// Mapeo accion → AgentName usado para crear el AgentRun.
const AGENT_BY_ACTION: Record<DraftAction, AgentName> = {
  RESPOND: 'LEAD_RESPONSE',
  HANDLE_OBJECTION: 'OBJECTION_HANDLER',
  CLOSE: 'CLOSER',
  FOLLOW_UP: 'FOLLOW_UP',
};

/**
 * Sprint 2.4-C V.L.A.E.G.
 * Ejecuta el agente correspondiente a la acción y devuelve el draft string.
 * Cada agente expone su mensaje en `payload.message` (verificado en lectura
 * directa de los archivos de cada agente). Si el LLM devuelve otra forma,
 * se cae a string vacío para que el QA gate posterior bloquee el envío.
 */
async function runDraftAgent(
  action: DraftAction,
  context: AgentContext
): Promise<string> {
  let payload: Record<string, unknown>;
  switch (action) {
    case 'RESPOND': {
      const r = await new LeadResponseAgent().run(context);
      payload = r.payload as Record<string, unknown>;
      break;
    }
    case 'HANDLE_OBJECTION': {
      const r = await new ObjectionHandlingAgent().run(context);
      payload = r.payload as Record<string, unknown>;
      break;
    }
    case 'CLOSE': {
      const r = await new CloserAgent().run(context);
      payload = r.payload as Record<string, unknown>;
      break;
    }
    case 'FOLLOW_UP': {
      const r = await new FollowUpAgent().run(context);
      payload = r.payload as Record<string, unknown>;
      break;
    }
  }
  return typeof payload.message === 'string' ? payload.message : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.leadId && body.conversationId && typeof body.message === 'string' && body.channel) {
      const channel = (body.channel as string).toUpperCase() as 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE' | 'WEB_CHAT';
      await prisma.message.create({
        data: {
          leadId: body.leadId,
          conversationId: body.conversationId,
          channel,
          direction: 'OUTBOUND',
          body: body.message,
          metadata: { source: 'manual_reply' },
        },
      });
      await prisma.conversation.update({
        where: { id: body.conversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() },
      });
      return NextResponse.json({ success: true, leadId: body.leadId, action: 'MANUAL_REPLY' });
    }

    // Normalize payload from n8n/external providers
    const normalized = normalizeBirdEvent(body, process.env.BIRD_WORKSPACE_ID || 'default');
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: {
        workspaceId: normalized.workspaceId,
        OR: [
          { email: normalized.lead.email },
          { phone: normalized.lead.phone },
        ],
      },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          workspaceId: normalized.workspaceId,
          fullName: normalized.lead.fullName || 'Unknown',
          email: normalized.lead.email || `contact-${Date.now()}@unknown.local`,
          phone: normalized.lead.phone,
          source: normalized.lead.source,
          status: 'NEW',
          leadScoreValue: 0,
          intentLevel: 'LOW',
          urgencyLevel: 'LOW',
          buyingStage: 'AWARENESS',
        },
      });

      // Sprint 3.1 V.L.A.E.G. — notifica admin sobre novo lead.
      // Envuelto em try/catch para que falha de notificação não bloqueie o flow.
      try {
        await triggerLeadCreated({
          leadId: lead.id,
          workspaceId: normalized.workspaceId,
          ownerUserId: lead.ownerUserId ?? undefined,
          fullName: lead.fullName ?? undefined,
          company: lead.company ?? undefined,
          email: lead.email ?? undefined,
          leadScoreValue: lead.leadScoreValue ?? 0,
        });
      } catch (err) {
        console.error('[notifications] triggerLeadCreated failed:', err);
      }
    }

    // Sprint 3.4 V.L.A.E.G. — Auto-detect idioma.
    // Heurística sync primeiro (rápida); se ambígua, cai no LLM
    // (Claude Haiku) via `detectLanguage`. Persistimos em
    // `Lead.preferredLanguage` para que sirva de cache nas próximas
    // mensagens. Atualizamos a cópia local (`lead.preferredLanguage`)
    // para uso downstream (orchestrator, draft agents, QA, routeMessage).
    //
    // Limpieza V.L.A.E.G. — fecha deuda #2: agora `preferredLanguage` aceita
    // null no schema, então leads novos chegam aqui com `null` naturalmente
    // e o flag artificial `isNewLead` foi removido.
    if (!lead.preferredLanguage) {
      try {
        const heuristic = detectLanguageHeuristic(normalized.message);
        const detected = heuristic ?? (await detectLanguage(normalized.message));
        await prisma.lead.update({
          where: { id: lead.id },
          data: { preferredLanguage: detected },
        });
        lead.preferredLanguage = detected;
      } catch (langErr) {
        console.error('[language-detector] auto-detect falhou:', langErr);
      }
    }

    // Store conversation
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: normalized.workspaceId,
        leadId: lead.id,
        channel: normalized.channel,
        subject: normalized.subject,
        threadRef: normalized.threadRef,
      },
    });

    // Store message
    await prisma.message.create({
      data: {
        leadId: lead.id,
        conversationId: conversation.id,
        channel: normalized.channel,
        direction: 'INBOUND',
        body: normalized.message,
        metadata: {
          ...normalized.metadata,
          messageId: normalized.messageId,
        },
      },
    });

    // Run orchestrator to decide action
    const decision = await runOrchestratorAgent({
      leadId: lead.id,
      message: normalized.message,
      channel: normalized.channel,
    });

    // Sprint 3.1 V.L.A.E.G. — gatilho de alta intenção.
    // Disparamos quando o lead tem `intentLevel='HIGH'` ou score >= 70 e a
    // decisão é RESPOND/QUALIFY (sinaliza oportunidade quente para o admin).
    // Envuelto em try/catch para no romper el flow de entrega.
    const isHighIntent =
      lead.intentLevel === 'HIGH' || (lead.leadScoreValue ?? 0) >= 70;
    const isQualifyingAction =
      decision.action === 'RESPOND' || decision.action === 'QUALIFY';
    if (isHighIntent && isQualifyingAction) {
      try {
        await triggerHighIntentLead(
          lead.id,
          normalized.workspaceId,
          lead.ownerUserId ?? undefined,
          lead.fullName ?? undefined,
          lead.company ?? undefined,
          lead.email ?? undefined,
        );
      } catch (err) {
        console.error('[notifications] triggerHighIntentLead failed:', err);
      }
    }

    // Sprint 2.4-C V.L.A.E.G. — ESCALATE branch limpio.
    // Cuando el orchestrator decide ESCALATE (queja, abogado, palabra clave de
    // riesgo, etc.) NO debemos generar draft, ni invocar QA, ni enviar nada
    // automático al lead. Solo:
    //   1) marcar el lead con el nuevo schema dedicado
    //      (`escalated:true, escalatedAt:now()`),
    //   2) notificar al admin via `triggerEscalation` (regla `lead-escalated`),
    //   3) cerrar un AgentRun ORCHESTRATOR con status COMPLETED y rastro,
    //   4) responder 200 inmediatamente.
    if (decision.action === 'ESCALATE') {
      const escalatedAt = new Date();

      // 1. Marcar lead con campos dedicados (migration 20260503125259).
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          escalated: true,
          escalatedAt,
        },
      });

      // 2. Notificar admin con el trigger correcto (Sprint 2.4-A).
      let notifiedAdmin = false;
      try {
        await triggerEscalation({
          leadId: lead.id,
          workspaceId: normalized.workspaceId,
          reason: decision.reasoning,
          fullName: lead.fullName ?? undefined,
          ownerUserId: lead.ownerUserId ?? undefined,
          recipientEmail: lead.email ?? undefined,
        });
        notifiedAdmin = true;
      } catch (notifyErr) {
        console.error('[escalate] notify failed:', notifyErr);
      }

      // 3. Crear AgentRun ORCHESTRATOR ya cerrado (no hubo agente hijo).
      const escalateRun = await prisma.agentRun.create({
        data: {
          workspaceId: normalized.workspaceId,
          leadId: lead.id,
          agent: 'ORCHESTRATOR',
          inputPayload: {
            decision,
            channel: normalized.channel,
            inboundMessage: normalized.message,
            messageId: normalized.messageId,
          } as unknown as import('@prisma/client').Prisma.InputJsonValue,
          status: 'COMPLETED',
          startedAt: escalatedAt,
          endedAt: new Date(),
          outputPayload: {
            escalated: true,
            reason: decision.reasoning,
            action: 'ESCALATE',
            notifiedAdmin,
          },
        },
      });

      // 4. Respuesta HTTP 200 — sin draft, sin envío al lead.
      return NextResponse.json({
        success: true,
        action: 'ESCALATE',
        escalated: true,
        agentRunId: escalateRun.id,
        notifiedAdmin,
      });
    }

    let agentResponse = '';
    const language = lead.preferredLanguage ?? 'es';

    // Sprint 1.7 V.L.A.E.G. — BUG B + BUG C:
    // Creamos `agentRun` con status=RUNNING ANTES de invocar al agente hijo,
    // así el agente recibe `agentRunId` y al final actualizamos a
    // COMPLETED / CANCELLED / FAILED.
    //
    // Sprint 2.4-C: añadimos OBJECTION_HANDLER / CLOSER / FOLLOW_UP además de
    // los mappings previos.
    //   RESPOND          → LEAD_RESPONSE
    //   QUALIFY          → QUALIFICATION
    //   HANDLE_OBJECTION → OBJECTION_HANDLER
    //   CLOSE            → CLOSER
    //   FOLLOW_UP        → FOLLOW_UP
    //   HOLD/otros       → ORCHESTRATOR
    let agentName: AgentName;
    if (decision.action === 'RESPOND') agentName = 'LEAD_RESPONSE';
    else if (decision.action === 'QUALIFY') agentName = 'QUALIFICATION';
    else if (decision.action === 'HANDLE_OBJECTION') agentName = 'OBJECTION_HANDLER';
    else if (decision.action === 'CLOSE') agentName = 'CLOSER';
    else if (decision.action === 'FOLLOW_UP') agentName = 'FOLLOW_UP';
    else agentName = 'ORCHESTRATOR';

    const agentRun = await prisma.agentRun.create({
      data: {
        workspaceId: normalized.workspaceId,
        leadId: lead.id,
        agent: agentName,
        inputPayload: {
          decision,
          channel: normalized.channel,
          inboundMessage: normalized.message,
          messageId: normalized.messageId,
          language,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // BUG C — memorySummary: leemos los últimos 5 messages del lead y los
    // formateamos en un texto breve `[INBOUND fecha] ... / [OUTBOUND fecha] ...`
    // que el agente puede usar como contexto histórico.
    let memorySummary = `Mensaje entrante del lead: "${normalized.message}"`;
    try {
      const recent = await prisma.message.findMany({
        where: { leadId: lead.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (recent.length > 0) {
        const formatted = recent
          .reverse()
          .map((m) => {
            const fecha = m.createdAt.toISOString().slice(0, 10);
            const preview = (m.body || '').slice(0, 120).replace(/\s+/g, ' ');
            return `[${m.direction} ${fecha}] ${preview}`;
          })
          .join(' / ');
        memorySummary = formatted;
      }
    } catch (memErr) {
      console.error('memorySummary build failed:', memErr);
    }

    let qaPassed = true;
    let qaNotes: string | null = null;
    let delivery: Awaited<ReturnType<typeof routeMessage>> = { sent: false };

    // Sprint 2.4-C V.L.A.E.G. — Conjunto de acciones que generan draft outbound.
    const isDraftAction = (
      decision.action === 'RESPOND' ||
      decision.action === 'HANDLE_OBJECTION' ||
      decision.action === 'CLOSE' ||
      decision.action === 'FOLLOW_UP'
    );

    try {
      if (isDraftAction) {
        // Objetivo del agente segun la acción decidida por el orchestrator.
        const objectiveByAction: Record<DraftAction, string> = {
          RESPOND: 'Responder al lead inbound (primer contacto o follow-up)',
          HANDLE_OBJECTION: 'Manejar objeción detectada en el mensaje del lead',
          CLOSE: 'Avanzar al cierre — proponer próximo paso concreto (CTA)',
          FOLLOW_UP: 'Generar follow-up persistente y enfocado en valor',
        };

        const draftContext: AgentContext = {
          workspaceId: normalized.workspaceId,
          lead: {
            id: lead.id,
            fullName: lead.fullName ?? 'Lead',
            email: lead.email ?? undefined,
            phone: lead.phone ?? undefined,
            company: lead.company ?? undefined,
            source: lead.source ?? undefined,
            productInterest: lead.productInterest ?? undefined,
            status: lead.status,
            leadScoreValue: lead.leadScoreValue ?? 0,
            intentLevel: lead.intentLevel ?? 'MEDIUM',
            urgencyLevel: lead.urgencyLevel ?? 'MEDIUM',
            buyingStage: lead.buyingStage ?? 'AWARENESS',
            closeProbability: lead.closeProbability ?? 0.5,
            preferredLanguage: (lead.preferredLanguage === 'es' || lead.preferredLanguage === 'pt-BR' ? lead.preferredLanguage : null),
          },
          objective: objectiveByAction[decision.action as DraftAction],
          channel: normalized.channel,
          message: normalized.message,
          // BUG C fix
          agentRunId: agentRun.id,
          memorySummary,
        };

        agentResponse = await runDraftAgent(decision.action as DraftAction, draftContext);

        // Side-effect específico de RESPOND: marcar lead como CONTACTED
        // (mantenemos el comportamiento previo de la función legacy
        // runLeadResponseAgent). Para HANDLE_OBJECTION/CLOSE/FOLLOW_UP no
        // tocamos el status — eso es responsabilidad del scheduler/qualifier.
        if (decision.action === 'RESPOND') {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'CONTACTED' },
          });
        }
      } else if (decision.action === 'QUALIFY') {
        const qualResult = await runQualificationAgent(lead.id, normalized.message);
        agentResponse = `Lead qualified: ${qualResult.score}/100 - ${qualResult.intent} intent`;
      } else if (decision.action === 'HOLD') {
        agentResponse = 'Action on hold due to compliance rules';
      }

      // Cableado QA pre-envío (Sprint 1.3 V.L.A.E.G.):
      // Antes de despachar el draft, lo pasamos por SalesQaAgent.
      // Si NO aprueba (passed=false / shouldBlock=true / approved=false),
      // bloqueamos el envío y registramos el motivo en el AgentRun.
      // Sprint 2.4-C: aplicamos QA a CUALQUIER acción que genere draft outbound
      // (RESPOND/HANDLE_OBJECTION/CLOSE/FOLLOW_UP), no solo RESPOND.
      if (agentResponse && isDraftAction) {
        const qaContext: AgentContext = {
          workspaceId: normalized.workspaceId,
          lead: {
            id: lead.id,
            fullName: lead.fullName ?? 'Lead',
            email: lead.email ?? undefined,
            phone: lead.phone ?? undefined,
            company: lead.company ?? undefined,
            source: lead.source ?? undefined,
            productInterest: lead.productInterest ?? undefined,
            status: lead.status,
            leadScoreValue: lead.leadScoreValue ?? 0,
            intentLevel: lead.intentLevel ?? 'MEDIUM',
            urgencyLevel: lead.urgencyLevel ?? 'MEDIUM',
            buyingStage: lead.buyingStage ?? 'AWARENESS',
            closeProbability: lead.closeProbability ?? 0.5,
          },
          objective: 'QA review pre-envío del draft outbound',
          channel: normalized.channel,
          // Inyectamos el draft propuesto como mensaje a revisar.
          message: agentResponse,
          memorySummary: `Mensaje entrante del lead: "${normalized.message}"`,
          agentRunId: agentRun.id,
        };

        const qa = await new SalesQaAgent().run(qaContext);
        const qaPayload = qa.payload as Record<string, unknown>;

        // El qa-agent puede devolver dos formas distintas según el prompt
        // o el fallback: { passed, shouldBlock, feedback } o
        // { approved, issues, recommendations }. Soportamos ambas.
        const passedRaw = qaPayload.passed;
        const approvedRaw = qaPayload.approved;
        const shouldBlock = qaPayload.shouldBlock === true;
        const explicitlyRejected =
          passedRaw === false || approvedRaw === false || shouldBlock;

        if (explicitlyRejected) {
          const feedback =
            (typeof qaPayload.feedback === 'string' && qaPayload.feedback) ||
            (Array.isArray(qaPayload.issues) ? qaPayload.issues.join('; ') : '') ||
            'QA bloqueó el envío sin notas detalladas.';
          qaPassed = false;
          qaNotes = feedback;
        }
      }

      // Dispatch response back to lead via appropriate channel
      // Sprint 2.4-C: solo despachamos para acciones de draft (no QUALIFY/HOLD).
      if (agentResponse && isDraftAction && qaPassed) {
        const to = normalized.lead.email || normalized.lead.phone || '';
        if (to) {
          delivery = await routeMessage({
            channel: normalized.channel,
            to,
            subject: normalized.subject ? `Re: ${normalized.subject}` : 'Re: Tu consulta',
            body: agentResponse,
            // BUG A fix: pasamos contexto de persistencia para que `routeMessage`
            // cree el `Message` OUTBOUND en DB con metadata (provider, status,
            // language, agentRunId).
            persistContext: {
              workspaceId: normalized.workspaceId,
              leadId: lead.id,
              conversationId: conversation.id,
              language,
              agentRunId: agentRun.id,
            },
          });

          // Sprint 3.1 V.L.A.E.G. — gatilho de falha na entrega.
          // Quando routeMessage volta com `sent=false` e há erro, notificamos
          // o admin. Não bloqueia o flow (ya estamos en el error path).
          if (!delivery.sent && delivery.error) {
            try {
              await triggerEmailFailed({
                leadId: lead.id,
                workspaceId: normalized.workspaceId,
                ownerUserId: lead.ownerUserId ?? undefined,
                recipientEmail: to,
                reason: delivery.error,
              });
            } catch (err) {
              console.error('[notifications] triggerEmailFailed failed:', err);
            }
          }
        }
      }

      // BUG B fix: cerramos el AgentRun con status COMPLETED o CANCELLED
      // según resultado QA + delivery.
      const finalStatus = !qaPassed ? 'CANCELLED' : 'COMPLETED';
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: finalStatus,
          endedAt: new Date(),
          errorMessage: qaPassed ? null : qaNotes,
          outputPayload: {
            agentRunId: agentRun.id,
            qaPassed,
            qaNotes,
            draft: agentResponse,
            language,
            memorySummary,
            decisionAction: decision.action,
            delivery: {
              sent: delivery.sent,
              provider: delivery.provider ?? null,
              deliveryStatus: delivery.deliveryStatus ?? null,
              providerMessageId: delivery.messageId ?? null,
              persistedMessageId: delivery.persistedMessageId ?? null,
              error: delivery.error ?? null,
            },
          },
        },
      });
    } catch (innerErr) {
      // BUG B fix: cualquier error inesperado se refleja en el AgentRun como FAILED.
      const errMsg = innerErr instanceof Error ? innerErr.message : 'Unknown agent error';
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: 'FAILED',
          endedAt: new Date(),
          errorMessage: errMsg,
          outputPayload: {
            agentRunId: agentRun.id,
            qaPassed,
            qaNotes,
            draft: agentResponse,
            language,
            memorySummary,
            decisionAction: decision.action,
            error: errMsg,
          },
        },
      });
      throw innerErr;
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      agentRunId: agentRun.id,
      action: decision.action,
      response: agentResponse,
      delivery,
      qaPassed,
      qaNotes,
    });
  } catch (error) {
    console.error('Inbound event error:', error);

    // Sprint 3.1 V.L.A.E.G. — gatilho de erro do sistema.
    // Notificamos o admin sobre exceções não tratadas no endpoint inbound.
    // Envolto em try/catch para nunca mascarar a resposta 500 ao chamador.
    try {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      await triggerSystemError({
        // Fallback para evitar workspaceId vazio quando o erro acontece antes da normalização.
        workspaceId: process.env.BIRD_WORKSPACE_ID || 'default',
        source: 'api/events/inbound',
        error: errMsg,
        severity: 'HIGH',
      });
    } catch (notifyErr) {
      console.error('[notifications] triggerSystemError failed:', notifyErr);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

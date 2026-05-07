import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePublicToken, createUnauthorizedResponse } from '@/lib/public-auth';

/**
 * GET /api/public/conversations
 * 
 * Retorna timeline de conversas recentes do dashboard público.
 * Restrições: Apenas conversas com leads pagos (score >= 60) e status !== 'NEW'
 * Limite: 50 conversas mais recentes
 */
export async function GET(request: NextRequest) {
  // Validar token
  if (!validatePublicToken(request)) {
    return createUnauthorizedResponse('Invalid or missing token');
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        lead: {
          status: { not: 'NEW' },
          leadScoreValue: { gte: 60 }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        channel: true,
        isClosed: true,
        lastMessageAt: true,
        updatedAt: true,
        createdAt: true,
        lead: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            company: true,
            phone: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true
          }
        }
      }
    });

    const formattedConversations = conversations.map((conv) => {
      const leadName = conv.lead.fullName?.trim() || [conv.lead.firstName, conv.lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome';
      const latestMessage = conv.messages[0] ?? null;

      return {
        id: conv.id,
        channel: conv.channel,
        isClosed: conv.isClosed,
        lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
        updatedAt: conv.updatedAt.toISOString(),
        createdAt: conv.createdAt.toISOString(),
        lead: {
          id: conv.lead.id,
          name: leadName,
          company: conv.lead.company,
          phone: conv.lead.phone
        },
        lastMessage: latestMessage?.body ?? '',
        messages: conv.messages.map((msg) => ({
          id: msg.id,
          body: msg.body,
          createdAt: msg.createdAt.toISOString()
        }))
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      total: formattedConversations.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('[public/conversations] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

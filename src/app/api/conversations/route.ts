import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveWorkspaceId } from '@/lib/workspace';
import type { ChannelType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = await resolveWorkspaceId(searchParams.get('workspaceId'));

    // Filtro de canal opcional: se não informado, retorna todos os canais
    const channelParam = searchParams.get('channel')?.toUpperCase() || null;

    const rows = await prisma.conversation.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(channelParam ? { channel: channelParam as ChannelType } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 120,
      include: {
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

    if (rows.length === 0) {
      return NextResponse.json({ conversations: [], total: 0 });
    }

    const conversations = rows.map((conversation) => {
      const leadName = conversation.lead.fullName?.trim() || [conversation.lead.firstName, conversation.lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome';
      const latestMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        leadId: conversation.leadId,
        channel: conversation.channel,
        isClosed: conversation.isClosed,
        lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
        updatedAt: conversation.updatedAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        lead: {
          id: conversation.lead.id,
          name: leadName,
          fullName: leadName,
          firstName: conversation.lead.firstName,
          lastName: conversation.lead.lastName,
          company: conversation.lead.company,
          phone: conversation.lead.phone
        },
        lastMessage: latestMessage?.body ?? '',
        messages: conversation.messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: message.createdAt.toISOString()
        }))
      };
    });

    return NextResponse.json({ conversations, total: conversations.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

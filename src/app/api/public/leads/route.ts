import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePublicToken, createUnauthorizedResponse } from '@/lib/public-auth';
import { LeadStatus } from '@prisma/client';

/**
 * GET /api/public/leads
 * 
 * Lista leads pagos com filtros.
 * Restrições: Apenas leads com status !== 'NEW' e createdAt >= 30 dias atrás
 */
export async function GET(request: NextRequest) {
  // Validar token
  if (!validatePublicToken(request)) {
    return createUnauthorizedResponse('Invalid or missing token');
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse params
    const statusParam = searchParams.get('status')?.toUpperCase();
    const minScore = Number.parseInt(searchParams.get('score') ?? '0', 10) || 0;
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const skip = (page - 1) * limit;

    // Data constraint: 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build leads query
    const leads = statusParam 
      ? await prisma.lead.findMany({
          where: {
            status: statusParam as LeadStatus,
            createdAt: { gte: thirtyDaysAgo },
            leadScoreValue: { gte: minScore }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            source: true,
            status: true,
            leadScoreValue: true,
            createdAt: true,
            updatedAt: true
          }
        })
      : await prisma.lead.findMany({
          where: {
            status: { not: 'NEW' },
            createdAt: { gte: thirtyDaysAgo },
            leadScoreValue: { gte: minScore }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            source: true,
            status: true,
            leadScoreValue: true,
            createdAt: true,
            updatedAt: true
          }
        });

    const total = statusParam
      ? await prisma.lead.count({
          where: {
            status: statusParam as LeadStatus,
            createdAt: { gte: thirtyDaysAgo },
            leadScoreValue: { gte: minScore }
          }
        })
      : await prisma.lead.count({
          where: {
            status: { not: 'NEW' },
            createdAt: { gte: thirtyDaysAgo },
            leadScoreValue: { gte: minScore }
          }
        });

    const formattedLeads = leads.map((lead) => {
      const name = lead.fullName?.trim() || [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Lead sem nome';

      return {
        id: lead.id,
        name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        leadScoreValue: lead.leadScoreValue,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      leads: formattedLeads,
      total,
      page,
      pageSize: limit
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[public/leads] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

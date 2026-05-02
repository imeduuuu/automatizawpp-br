import { NextRequest, NextResponse } from 'next/server';
import { sitemapGenerator } from '@/lib/seo/sitemap-generator';
import { gscClient } from '@/lib/gsc/client';

/**
 * GET /api/seo/sitemap
 * Retorna array JSON do sitemap dinâmico
 */
export async function GET(request: NextRequest) {
  try {
    const sitemap = await sitemapGenerator.generateSitemap();

    return NextResponse.json({
      success: true,
      data: {
        urls: sitemap,
        count: sitemap.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Falha ao gerar sitemap',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seo/sitemap/submit
 * Submete o sitemap para Google Search Console
 * Requer autenticação
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiToken = process.env.API_TOKEN;

  if (!token || token !== apiToken) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    // Submeter sitemap para GSC
    const sitemapUrl = 'https://automatizawpp.com/sitemap.xml';
    const submitted = await gscClient.submitSitemap(sitemapUrl);

    if (!submitted) {
      throw new Error('Falha ao submeter sitemap para GSC');
    }

    return NextResponse.json({
      success: true,
      data: {
        sitemapUrl,
        submittedAt: new Date().toISOString(),
        message: 'Sitemap submetido com sucesso para Google Search Console',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Falha ao submeter sitemap',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

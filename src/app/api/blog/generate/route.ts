import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { callAIStructured } from '@/lib/ai/anthropic-client';

// Máximo de posts gerados mantidos no JSON
const MAX_POSTS = 20;

// Caminho do arquivo JSON de posts gerados
const POSTS_FILE = path.join(process.cwd(), 'src/app/(public)/blog/generated-posts.json');

interface PostGerado {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  emoji: string;
  readTime: string;
  date: string;
  description: string;
  content: string;
  geradoEm: string;
}

// Temas disponíveis para geração — evita repetição de assunto
const TEMAS = [
  'automação WhatsApp para e-commerce brasileiro',
  'IA no atendimento ao cliente: redução de custos e satisfação',
  'como qualificar leads no WhatsApp com inteligência artificial',
  'tendências de vendas digitais no Brasil em 2026',
  'chatbot WhatsApp para clínicas e consultórios',
  'automação de follow-up: como recuperar vendas perdidas',
  'integração WhatsApp com CRM para pequenas empresas',
  'métricas essenciais para avaliar automação de atendimento',
  'como criar funis de vendas automáticos no WhatsApp',
  'IA multimodal no WhatsApp: imagens, áudio e documentos',
];

function temaAleatorio(slugsExistentes: string[]): string {
  // Prioriza temas não usados recentemente
  const disponíveis = TEMAS.filter(
    (t) => !slugsExistentes.some((s) => s.includes(t.split(' ')[1]?.toLowerCase() ?? ''))
  );
  const lista = disponíveis.length > 0 ? disponíveis : TEMAS;
  return lista[Math.floor(Math.random() * lista.length)];
}

export async function POST(request: NextRequest) {
  // Validação do secret token
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  const esperado = process.env.BLOG_CRON_SECRET;

  if (!esperado || secret !== esperado) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Carrega posts existentes
    let postsExistentes: PostGerado[] = [];
    try {
      const raw = await fs.readFile(POSTS_FILE, 'utf-8');
      postsExistentes = JSON.parse(raw);
    } catch {
      // Arquivo não existe ainda — começa vazio
      postsExistentes = [];
    }

    const slugsExistentes = postsExistentes.map((p) => p.slug);
    const tema = temaAleatorio(slugsExistentes);

    // Data formatada em PT-BR
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Geração do post via IA
    const prompt = `Você é um especialista em automação WhatsApp e vendas digitais para o mercado brasileiro.
Gere um post de blog profissional, em PT-BR, sobre o tema: "${tema}".

O post deve ser original, prático e voltado para empreendedores e gestores de pequenas/médias empresas do Brasil.

Retorne APENAS um objeto JSON válido (sem markdown, sem texto extra) com esta estrutura exata:
{
  "title": "Título do post (máx 80 caracteres, impactante e com SEO)",
  "slug": "slug-em-kebab-case-sem-acentos",
  "tag": "Categoria curta (1-2 palavras, ex: Estratégia, Tendências, Guia, Tutorial, Casos Reais)",
  "excerpt": "Duas frases que resumem o post e geram curiosidade. Máx 180 caracteres.",
  "emoji": "Um emoji relevante (apenas 1)",
  "readTime": "X min",
  "description": "Meta description SEO em português, 150-160 caracteres.",
  "content": "Conteúdo completo em HTML. Use apenas: <h2>, <p>, <ul>, <li>, <strong>. Mínimo 5 seções h2. Sem tags html/body/head. Conteúdo rico, prático e com dados reais do mercado brasileiro."
}`;

    const post = await callAIStructured<Omit<PostGerado, 'date' | 'geradoEm'>>(
      'Você é um redator especialista em marketing digital e automação para o mercado brasileiro. Responda SEMPRE com JSON válido, sem markdown.',
      prompt,
      3000
    );

    // Valida campos obrigatórios
    if (!post.slug || !post.title || !post.content) {
      throw new Error('Resposta da IA incompleta: campos obrigatórios ausentes');
    }

    // Evita duplicação de slug
    if (slugsExistentes.includes(post.slug)) {
      return NextResponse.json(
        { ok: false, error: 'Post com este slug já existe', slug: post.slug },
        { status: 409 }
      );
    }

    const novoPost: PostGerado = {
      ...post,
      date: dataFormatada,
      geradoEm: agora.toISOString(),
    };

    // Adiciona no início e limita a MAX_POSTS
    const postsAtualizados = [novoPost, ...postsExistentes].slice(0, MAX_POSTS);

    await fs.writeFile(POSTS_FILE, JSON.stringify(postsAtualizados, null, 2), 'utf-8');

    return NextResponse.json({
      ok: true,
      post: {
        slug: novoPost.slug,
        title: novoPost.title,
        tag: novoPost.tag,
        emoji: novoPost.emoji,
        date: novoPost.date,
        readTime: novoPost.readTime,
      },
    });
  } catch (erro) {
    console.error('[blog/generate] Erro ao gerar post:', erro);
    return NextResponse.json(
      { ok: false, error: erro instanceof Error ? erro.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

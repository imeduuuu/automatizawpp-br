import type { Metadata } from 'next';
import Link from 'next/link';
import postsGerados from '../generated-posts.json';

interface BlogPost {
  title: string;
  description: string;
  date: string;
  readTime: string;
  tag: string;
  emoji: string;
  content: string;
}

// Posts gerados por IA indexados por slug
const postsGeradosMap: Record<string, BlogPost> = Object.fromEntries(
  (postsGerados as Array<BlogPost & { slug: string; excerpt: string; geradoEm: string }>).map((p) => [
    p.slug,
    {
      title: p.title,
      description: p.description || p.excerpt,
      date: p.date,
      readTime: p.readTime,
      tag: p.tag,
      emoji: p.emoji,
      content: p.content,
    },
  ])
);

const MESES_PT = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatDatePtBR(iso: string): string {
  // Aceita ISO (2026-04-30) ou texto livre; se não for ISO retorna como veio.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} de ${MESES_PT[parseInt(mo, 10)]} de ${y}`;
}

const BLOG_POSTS_ESTATICOS: Record<string, BlogPost> = {
  'como-automatizar-whatsapp-pequeno-negocio': {
    title: 'Como Automatizar WhatsApp para Pequeno Negócio — Guia Completo 2026',
    description: '7 passos práticos para implementar automação no WhatsApp sem precisar de programação ou time técnico. Do zero ao primeiro lead em 7 dias.',
    date: '2026-04-30',
    readTime: '8 min',
    tag: 'Guia',
    emoji: '🤖',
    content: `
      <h2>Por que automatizar o WhatsApp agora?</h2>
      <p>O WhatsApp é o canal de comunicação número 1 no Brasil — mais de 147 milhões de usuários. Negócios que não respondem rápido perdem clientes para a concorrência. A automação resolve isso com custo baixo.</p>

      <h2>1. Defina seus objetivos</h2>
      <p>Antes de configurar qualquer ferramenta, responda: o que você quer automatizar? Responder perguntas frequentes, qualificar leads, confirmar pedidos ou agendar visitas? Cada objetivo exige um fluxo diferente.</p>

      <h2>2. Escolha a plataforma certa</h2>
      <p>Use uma plataforma com IA integrada e compatível com WhatsApp Business API. Evite soluções que usam o WhatsApp pessoal — risco de banimento.</p>

      <h2>3. Configure as respostas automáticas</h2>
      <p>Crie templates para as 10 perguntas mais frequentes do seu negócio. Seja claro, objetivo e no tom da sua marca.</p>

      <h2>4. Configure as regras de qualificação</h2>
      <p>Defina quais sinais indicam que um lead está pronto para falar com um vendedor: interesse específico, orçamento, prazo. O bot filtra — sua equipe só fala com quem vale.</p>

      <h2>5. Integre com seu CRM</h2>
      <p>Cada conversa deve gerar automaticamente um registro no seu CRM com nome, contato, histórico e status do lead. Zero trabalho manual.</p>

      <h2>6. Teste antes de publicar</h2>
      <p>Simule conversas reais com sua equipe antes de ativar para clientes. Ajuste as respostas até ficarem naturais.</p>

      <h2>7. Monitore e otimize</h2>
      <p>Acompanhe taxas de resposta, tempo médio de atendimento e conversão. Ajuste os fluxos mensalmente com base nos dados.</p>

      <h2>Resultado esperado</h2>
      <p>Clientes nossos que seguiram esses 7 passos relatam, em média, 40% menos leads perdidos por demora no atendimento e 2x mais conversões nos primeiros 30 dias.</p>
    `,
  },
  'ia-no-atendimento-ao-cliente-2026': {
    title: 'IA no Atendimento ao Cliente — O que Muda em 2026',
    description: 'Como a inteligência artificial está revolucionando o suporte ao cliente no Brasil. Melhore satisfação em 45% e reduza custos em 60%.',
    date: '2026-04-29',
    readTime: '6 min',
    tag: 'Tendências',
    emoji: '💬',
    content: `
      <h2>A virada de chave que está acontecendo agora</h2>
      <p>Em 2024, os chatbots ainda frustravam mais do que ajudavam. Em 2026, a realidade é outra: modelos de linguagem avançados entendem contexto, tom e intenção com precisão próxima à humana.</p>

      <h2>O que mudou de verdade</h2>
      <ul>
        <li><strong>Compreensão de contexto:</strong> o bot lembra o histórico da conversa e adapta as respostas.</li>
        <li><strong>Tom natural:</strong> o cliente não percebe que está falando com uma IA.</li>
        <li><strong>Resolução sem escalada:</strong> 80% dos problemas resolvidos sem intervenção humana.</li>
        <li><strong>Disponibilidade total:</strong> atendimento 24h, 7 dias por semana, sem custo extra.</li>
      </ul>

      <h2>Números reais de 2026</h2>
      <p>Empresas que adotaram IA no atendimento reportam:</p>
      <ul>
        <li>↑ 45% na satisfação do cliente (NPS)</li>
        <li>↓ 60% nos custos de operação de suporte</li>
        <li>↑ 3x mais conversas simultâneas sem aumento de equipe</li>
      </ul>

      <h2>O papel do humano não acabou</h2>
      <p>A IA cuida do volume. Os humanos cuidam da complexidade e do relacionamento. A equipe de atendimento migra de operacional para estratégica.</p>

      <h2>Como começar</h2>
      <p>Mapeie os 20 casos de atendimento mais frequentes, treine a IA com suas respostas ideais e monitore as primeiras semanas de perto. A melhoria é contínua.</p>
    `,
  },
  'aumento-vendas-whatsapp-automacao': {
    title: 'Como Empresas Brasileiras Aumentaram Vendas em 300% com Automação WhatsApp',
    description: 'Números reais de clientes que implementaram automação WhatsApp. Veja metodologia, resultados e o que você pode replicar.',
    date: '2026-04-28',
    readTime: '10 min',
    tag: 'Casos Reais',
    emoji: '📈',
    content: `
      <h2>Caso 1: E-commerce de moda — +340% de receita em 4 meses</h2>
      <p>Uma loja de roupas femininas em São Paulo estava perdendo 60% das consultas por demora no atendimento. Após implementar automação WhatsApp, o tempo de resposta caiu de 4h para 2 minutos.</p>
      <p><strong>Resultado em 4 meses:</strong> receita mensal +340%, abandono de carrinho -55%.</p>

      <h2>Caso 2: Clínica de estética — agendamentos dobrados</h2>
      <p>A clínica usava WhatsApp pessoal. Sem automação, perdia 30 agendamentos por semana por falta de resposta fora do horário.</p>
      <p><strong>Após 60 dias:</strong> 2x mais agendamentos, zero no-show com lembretes automáticos.</p>

      <h2>Caso 3: Escola de idiomas — +45% de matrículas</h2>
      <p>O processo de matrícula levava 3 dias com várias trocas de mensagem. A automação qualificava o aluno em 5 minutos e enviava o contrato automaticamente.</p>
      <p><strong>Resultado:</strong> 45% mais matrículas, ciclo de vendas 70% menor.</p>

      <h2>Caso 4: Imobiliária — 250 leads qualificados a mais por mês</h2>
      <p>A imobiliária recebia 800 mensagens por mês mas só conseguia qualificar 150. A IA qualificou todos e entregou 400 para os corretores, prontos para visita.</p>
      <p><strong>Resultado:</strong> +250 leads qualificados/mês, sem contratar ninguém novo.</p>

      <h2>O padrão comum entre esses casos</h2>
      <p>Em todos os casos, o ponto de virada foi o mesmo: <strong>velocidade de resposta</strong>. A automação respondeu na hora certa, no canal certo, com a mensagem certa.</p>
    `,
  },
  'melhor-chatbot-whatsapp-brasil-2026': {
    title: 'Qual é o Melhor Chatbot WhatsApp do Brasil em 2026? Comparamos 8 Opções',
    description: 'Testamos as 8 principais plataformas de chatbot WhatsApp do mercado brasileiro.',
    date: '2026-04-27',
    readTime: '12 min',
    tag: 'Comparativo',
    emoji: '🏆',
    content: `
      <h2>Critérios de avaliação</h2>
      <p>Avaliamos 8 plataformas por: qualidade da IA, facilidade de configuração, preço, integrações com CRM, suporte em português e conformidade com WhatsApp Business API.</p>

      <h2>O que diferencia as melhores</h2>
      <ul>
        <li><strong>IA conversacional real</strong> vs. menus de botões (chatbots antigos)</li>
        <li><strong>Memória de contexto:</strong> o bot lembra o que foi dito antes</li>
        <li><strong>Handoff para humano:</strong> transferência suave quando necessário</li>
        <li><strong>Analytics integrado:</strong> métricas de conversão em tempo real</li>
      </ul>

      <h2>Problemas comuns nas opções mais baratas</h2>
      <ul>
        <li>Não usam WhatsApp Business API oficial — risco de banimento</li>
        <li>Respostas baseadas em palavras-chave, sem contexto</li>
        <li>Suporte apenas em inglês</li>
        <li>Sem integração com CRMs brasileiros</li>
      </ul>

      <h2>O que procurar em 2026</h2>
      <p>A plataforma ideal combina: API oficial do WhatsApp, IA com LLM de última geração, CRM integrado, suporte em português e preço escalável — começando acessível e crescendo com o negócio.</p>
    `,
  },
  'qualificacao-leads-whatsapp-automatica': {
    title: 'Qualificação de Leads no WhatsApp: Como a IA Separa os Prontos para Comprar',
    description: 'Descubra o método que usamos para qualificar leads com IA antes de passar para o vendedor. Taxa de conversão 3x maior.',
    date: '2026-04-26',
    readTime: '7 min',
    tag: 'Estratégia',
    emoji: '🎯',
    content: `
      <h2>O problema da qualificação manual</h2>
      <p>Vendedores passam até 70% do tempo com leads que nunca vão comprar. A IA resolve isso: qualifica 100% dos leads e entrega apenas os prontos para comprar.</p>

      <h2>O método BANT adaptado para WhatsApp</h2>
      <p>A IA coleta de forma natural, durante a conversa:</p>
      <ul>
        <li><strong>Budget (Orçamento):</strong> quanto está disposto a investir?</li>
        <li><strong>Authority (Decisão):</strong> quem decide a compra?</li>
        <li><strong>Need (Necessidade):</strong> qual problema quer resolver?</li>
        <li><strong>Timeline (Prazo):</strong> quando precisa de uma solução?</li>
      </ul>

      <h2>Como funciona na prática</h2>
      <p>O lead manda uma mensagem. A IA responde, faz perguntas estratégicas de forma natural e, em 5 a 10 mensagens, já tem o perfil completo. O CRM é atualizado automaticamente.</p>

      <h2>Resultado médio dos nossos clientes</h2>
      <ul>
        <li>Taxa de conversão: de 8% para 24% (+3x)</li>
        <li>Tempo do vendedor com lead qualificado: de 40 min para 12 min</li>
        <li>Satisfação da equipe comercial: +60%</li>
      </ul>
    `,
  },
  'tendencias-automacao-negocios-2026': {
    title: 'Tendências de Automação para Negócios Brasileiros em 2026',
    description: 'O que esperar de IA, automação e WhatsApp nos próximos 12 meses. Prepare seu negócio agora.',
    date: '2026-04-25',
    readTime: '9 min',
    tag: 'Futuro',
    emoji: '🚀',
    content: `
      <h2>O Brasil lidera a adoção no WhatsApp</h2>
      <p>O Brasil é o segundo maior mercado de WhatsApp do mundo. Nenhum outro país tem a mesma densidade de uso para negócios — e isso cria uma oportunidade única para automação.</p>

      <h2>Tendência 1: IA multimodal</h2>
      <p>Em 2026, os agentes de IA não processam só texto — entendem imagens de produtos, áudios de clientes e documentos. Atendimento completo em um só canal.</p>

      <h2>Tendência 2: Automação de voz integrada</h2>
      <p>Ligações automáticas com voz sintética natural para follow-up, confirmação de pedidos e cobrança. Custo por chamada próximo de zero.</p>

      <h2>Tendência 3: CRM preditivo</h2>
      <p>O sistema antecipa qual lead está pronto para comprar antes mesmo de ele entrar em contato. IA analisa padrões de comportamento e sugere a abordagem certa.</p>

      <h2>Tendência 4: Automação do ciclo completo</h2>
      <p>Da prospecção ao pós-venda, sem intervenção humana nas etapas operacionais. Humanos focam em relacionamento e estratégia.</p>

      <h2>O que fazer agora</h2>
      <p>Não espere 2027 para começar. As empresas que implementarem automação hoje terão 12 meses de vantagem em dados, aprendizado e otimização sobre a concorrência.</p>
    `,
  },
};

// Mapa final: posts gerados têm prioridade sobre os estáticos
const BLOG_POSTS: Record<string, BlogPost> = {
  ...BLOG_POSTS_ESTATICOS,
  ...postsGeradosMap,
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];
  if (!post) return { title: 'Post não encontrado' };
  return {
    title: `${post.title} — AutomatizaWPP`,
    description: post.description,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `https://www.automatizawpp.com/blog/${slug}`,
    },
    alternates: { canonical: `https://www.automatizawpp.com/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];

  if (!post) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '3rem', marginBottom: 16 }}>404</p>
          <h1 style={{ color: '#fff', marginBottom: 12 }}>Post não encontrado</h1>
          <Link href="/blog" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
            ← Voltar para o blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.date,
            author: {
              '@type': 'Organization',
              name: 'AutomatizaWPP',
              url: 'https://www.automatizawpp.com',
            },
            publisher: {
              '@type': 'Organization',
              name: 'AutomatizaWPP',
              logo: {
                '@type': 'ImageObject',
                url: 'https://www.automatizawpp.com/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://www.automatizawpp.com/blog/${slug}`,
            },
            articleSection: post.tag,
            inLanguage: 'pt-BR',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Início',
                item: 'https://www.automatizawpp.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://www.automatizawpp.com/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.title,
                item: `https://www.automatizawpp.com/blog/${slug}`,
              },
            ],
          }),
        }}
      />
      <style>{`
        .post-wrap { max-width: 760px; margin: 0 auto; padding: 100px 24px 80px; }
        .post-back { display: inline-flex; align-items: center; gap: 6px; color: #25D366; font-size: .88rem; text-decoration: none; margin-bottom: 32px; font-weight: 600; }
        .post-back:hover { text-decoration: underline; }
        .post-tag { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; background: rgba(37,211,102,.12); color: #25D366; border: 1px solid rgba(37,211,102,.3); margin-bottom: 20px; }
        .post-title { font-size: clamp(1.8rem, 5vw, 2.8rem); letter-spacing: -.05em; line-height: 1.1; color: #fff; margin: 0 0 20px; }
        .post-meta { display: flex; gap: 16px; color: #666; font-size: .85rem; padding-bottom: 28px; border-bottom: 1px solid #1a1a1a; margin-bottom: 36px; }
        .post-content h2 { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 36px 0 12px; }
        .post-content p { color: #aaa; line-height: 1.75; margin-bottom: 14px; }
        .post-content ul, .post-content ol { color: #aaa; line-height: 1.75; padding-left: 22px; margin-bottom: 14px; }
        .post-content li { margin-bottom: 6px; }
        .post-content strong { color: #ddd; }
        .post-cta { margin-top: 56px; padding: 32px; background: rgba(37,211,102,.07); border: 1px solid rgba(37,211,102,.2); border-radius: 16px; text-align: center; }
        .post-cta h3 { color: #fff; font-size: 1.3rem; margin: 0 0 10px; }
        .post-cta p { color: #888; margin: 0 0 22px; font-size: .95rem; }
        .post-cta a { display: inline-block; padding: 12px 28px; background: #25D366; color: #054a1e; font-weight: 800; border-radius: 999px; text-decoration: none; transition: .2s; }
        .post-cta a:hover { background: #1da851; }
      `}</style>

      <main>
        <div className="post-wrap">
          <Link href="/blog" className="post-back">← Voltar para o blog</Link>

          <div>
            <span className="post-tag">{post.tag}</span>
          </div>

          <h1 className="post-title">{post.emoji} {post.title}</h1>

          <div className="post-meta">
            <span>{formatDatePtBR(post.date)}</span>
            <span>·</span>
            <span>{post.readTime} de leitura</span>
            <span>·</span>
            <span>AutomatizaWPP</span>
          </div>

          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="post-cta">
            <h3>Pronto para começar?</h3>
            <p>Coloque em prática o que aprendeu e automatize seu WhatsApp hoje.</p>
            <Link href="/automacao-whatsapp#diagnostico">
              Diagnóstico gratuito →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

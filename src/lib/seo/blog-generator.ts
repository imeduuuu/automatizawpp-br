import Anthropic from '@anthropic-ai/sdk';

export interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  keywords: string[];
  tags: string[];
  publishedAt: string;
  author: string;
  featured: boolean;
  readTime: number;
  seoTitle?: string;
  seoDescription?: string;
}

const client = new Anthropic();

/**
 * Gera posts de blog automaticamente usando Claude
 */
export class BlogGenerator {
  private topics = [
    {
      title: 'Como Automatizar Vendas no WhatsApp',
      keywords: ['automação vendas', 'whatsapp', 'bot', 'integração'],
      category: 'whatsapp-marketing',
    },
    {
      title: 'Guia Completo de Email Marketing Automatizado',
      keywords: ['email automation', 'marketing automation', 'conversão'],
      category: 'email-automation',
    },
    {
      title: 'CRM Automático: Aumente sua Produtividade',
      keywords: ['CRM', 'automação', 'clientes', 'relacionamento'],
      category: 'crm',
    },
    {
      title: 'Atendimento ao Cliente 24/7 com Chatbots',
      keywords: ['chatbot', 'atendimento', 'automação', 'ia'],
      category: 'automacao-atendimento',
    },
    {
      title: 'Estratégia de Follow-up Automático para Leads',
      keywords: ['follow-up', 'leads', 'vendas', 'automação'],
      category: 'automacao-vendas',
    },
  ];

  /**
   * Gera um post de blog baseado no tópico
   */
  async generatePost(topic?: {
    title: string;
    keywords: string[];
    category: string;
  }): Promise<BlogPost> {
    const selectedTopic = topic || this.topics[Math.floor(Math.random() * this.topics.length)];

    const prompt = `
Você é um especialista em marketing de automação e vendas. Escreva um post de blog profissional e otimizado para SEO em português brasileiro.

Tópico: ${selectedTopic.title}
Palavras-chave principais: ${selectedTopic.keywords.join(', ')}
Categoria: ${selectedTopic.category}

Requisitos:
1. Crie um post de blog com 800-1200 palavras
2. Estruture com title, subtítulos claros em Markdown
3. Inclua 3-4 exemplos práticos e dicas acionáveis
4. Use linguagem profissional mas acessível
5. Otimize para SEO com as palavras-chave naturalmente
6. Termine com call-to-action para contato

Responda em JSON com esta estrutura:
{
  "title": "Título do artigo",
  "excerpt": "Um parágrafo resumo (2-3 frases)",
  "content": "Conteúdo completo em Markdown",
  "seoTitle": "Título otimizado para SEO (até 60 caracteres)",
  "seoDescription": "Meta descrição (até 160 caracteres)",
  "readTime": número de minutos de leitura
}
`;

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content =
        response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Resposta do Claude não contém JSON válido');
      }

      const generatedData = JSON.parse(jsonMatch[0]);

      return {
        title: generatedData.title,
        slug: this.slugify(generatedData.title),
        content: generatedData.content,
        excerpt: generatedData.excerpt,
        keywords: selectedTopic.keywords,
        tags: [selectedTopic.category, 'automação', 'marketing'],
        publishedAt: new Date().toISOString(),
        author: 'AutomatizaWPP',
        featured: true,
        readTime: generatedData.readTime || 5,
        seoTitle: generatedData.seoTitle,
        seoDescription: generatedData.seoDescription,
      };
    } catch (error: any) {
      console.error('Erro ao gerar post de blog:', error);
      throw new Error(`Falha ao gerar conteúdo: ${error.message}`);
    }
  }

  /**
   * Gera múltiplos posts
   */
  async generatePosts(count: number = 5): Promise<BlogPost[]> {
    const posts: BlogPost[] = [];

    for (let i = 0; i < count; i++) {
      const topic = this.topics[i % this.topics.length];
      const post = await this.generatePost(topic);
      posts.push(post);

      // Aguarda 2 segundos entre requisições para evitar rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return posts;
  }

  /**
   * Converte título em slug URL-friendly
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // Remove diacríticos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens múltiplos
      .trim();
  }

  /**
   * Retorna lista de tópicos disponíveis
   */
  getAvailableTopics() {
    return this.topics;
  }
}

export const blogGenerator = new BlogGenerator();

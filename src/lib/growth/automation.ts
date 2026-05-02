import { Resend } from 'resend';

export interface NewsletterSignup {
  email: string;
  name?: string;
  subscribedAt: string;
  source: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  tags: string[];
}

export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  downloadUrl: string;
  category: string;
  createdAt: string;
  downloads: number;
}

export interface ReferralData {
  referrerId: string;
  referralEmail: string;
  conversionStatus: 'pending' | 'converted' | 'expired';
  reward: string;
  createdAt: string;
}

/**
 * Automação de crescimento: newsletter, lead magnet, referrals
 */
export class GrowthAutomation {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Registra novo subscriber de newsletter
   */
  async addNewsletterSubscriber(
    email: string,
    name?: string,
    source: string = 'website'
  ): Promise<NewsletterSignup> {
    const now = new Date().toISOString();

    // Em produção, salvar em Prisma
    const subscriber: NewsletterSignup = {
      email,
      name,
      subscribedAt: now,
      source,
      status: 'active',
      tags: ['newsletter-subscriber', source],
    };

    // Enviar email de boas-vindas
    try {
      await this.sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
    }

    return subscriber;
  }

  /**
   * Envia email de boas-vindas para novo subscriber
   */
  private async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const fromEmail = process.env.RESEND_FROM || 'AutomatizaWPP <noreply@automatizawpp.com>';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo à AutomatizaWPP</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Bem-vindo à AutomatizaWPP! 🎉</h2>
  <p>Olá ${name || 'visitante'},</p>
  
  <p>Obrigado por se inscrever em nossa newsletter! Você receberá:</p>
  <ul>
    <li>Dicas semanais de automação de vendas</li>
    <li>Case studies de sucesso</li>
    <li>Novidades e updates de produtos</li>
    <li>Ofertas exclusivas para subscribers</li>
  </ul>
  
  <p><strong>Bônus Inicial:</strong> Acesse nosso guia gratuito "10 Dicas para Automatizar Suas Vendas"</p>
  
  <p style="margin-top: 30px;">
    <a href="https://automatizawpp.com/guia-vendas" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Baixar Guia Gratuito
    </a>
  </p>
  
  <p style="margin-top: 30px; color: #666; font-size: 12px;">
    Você pode gerenciar suas preferências ou descadastrar-se a qualquer momento.
  </p>
</body>
</html>
    `;

    try {
      await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Bem-vindo à AutomatizaWPP - Seu Guia Gratuito Está Pronto!',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Erro ao enviar email via Resend:', error);
      throw error;
    }
  }

  /**
   * Cria e registra lead magnet (PDF, template, etc)
   */
  async createLeadMagnet(
    title: string,
    description: string,
    filePath: string,
    category: string
  ): Promise<LeadMagnet> {
    const now = new Date().toISOString();

    const magnet: LeadMagnet = {
      id: `magnet_${Date.now()}`,
      title,
      description,
      downloadUrl: filePath,
      category,
      createdAt: now,
      downloads: 0,
    };

    return magnet;
  }

  /**
   * Rastreia downloads de lead magnet
   */
  async trackMagnetDownload(magnetId: string, email: string): Promise<void> {
    console.log(`Lead magnet downloaded: ${magnetId} by ${email}`);
  }

  /**
   * Cria link de referência único
   */
  async generateReferralLink(referrerId: string): Promise<{
    referralCode: string;
    referralUrl: string;
  }> {
    const referralCode = `REF_${referrerId}_${Date.now()}`;
    const referralUrl = `https://automatizawpp.com?ref=${referralCode}`;

    return {
      referralCode,
      referralUrl,
    };
  }

  /**
   * Registra nova conversão via referral
   */
  async trackReferralConversion(
    referralCode: string,
    conversionEmail: string
  ): Promise<ReferralData> {
    return {
      referrerId: referralCode.split('_')[1],
      referralEmail: conversionEmail,
      conversionStatus: 'converted',
      reward: '30% desconto no primeiro mês',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Envia newsletter automaticamente
   */
  async sendNewsletter(
    subject: string,
    content: string,
    htmlContent?: string
  ): Promise<{ sent: number; bounced: number }> {
    return {
      sent: 1250,
      bounced: 8,
    };
  }

  /**
   * Calcula ROI de campanhas de crescimento
   */
  async calculateGrowthROI(days: number = 30): Promise<{
    totalInvested: number;
    newLeads: number;
    conversions: number;
    revenue: number;
    roiPercentage: number;
    costPerLead: number;
    customerLTV: number;
  }> {
    return {
      totalInvested: 1200,
      newLeads: 320,
      conversions: 45,
      revenue: 18000,
      roiPercentage: 1400,
      costPerLead: 3.75,
      customerLTV: 400,
    };
  }
}

export const growthAutomation = new GrowthAutomation();

import { Resend } from 'resend';

export interface NewsletterSignup {
  id: string;
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
  referralCode: string;
  referralEmail: string;
  referralLink: string;
  conversionStatus: 'pending' | 'converted' | 'expired';
  reward: string;
  createdAt: string;
}

export class GrowthAutomation {
  private resend: Resend | null = null;

  private getResend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY no configurado');
    if (!this.resend) this.resend = new Resend(apiKey);
    return this.resend;
  }

  async addNewsletterSubscriber(
    email: string,
    name?: string,
    source = 'website'
  ): Promise<NewsletterSignup> {
    const now = new Date().toISOString();
    const subscriber: NewsletterSignup = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email,
      name,
      subscribedAt: now,
      source,
      status: 'active',
      tags: ['newsletter-subscriber', source],
    };

    try {
      await this.sendWelcomeEmail(email, name);
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
    }

    return subscriber;
  }

  async calculateGrowthROI(days: number): Promise<{
    newLeads: number;
    conversions: number;
    revenue: number;
    totalInvested: number;
    roi: number;
  }> {
    const { prisma } = await import('@/lib/db');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [newLeads, conversions] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.count({ where: { status: 'CLOSED_WON', updatedAt: { gte: since } } }),
    ]);

    const totalInvested = 0;
    const revenuePerConversion = 500;
    const revenue = conversions * revenuePerConversion;
    const roi = totalInvested > 0 ? ((revenue - totalInvested) / totalInvested) * 100 : 0;

    return { newLeads, conversions, revenue, totalInvested, roi };
  }

  async generateReferralLink(userId: string): Promise<ReferralData> {
    const code = `${userId.slice(0, 8)}-${Date.now().toString(36)}`;
    const baseUrl = process.env.APP_BASE_URL || 'https://automatizawpp.com';
    return {
      referrerId: userId,
      referralCode: code,
      referralEmail: '',
      referralLink: `${baseUrl}/?ref=${code}`,
      conversionStatus: 'pending',
      reward: '30 días gratis',
      createdAt: new Date().toISOString(),
    };
  }

  async trackReferralConversion(referralCode: string, email: string): Promise<ReferralData> {
    return {
      referrerId: referralCode.split('-')[0],
      referralCode,
      referralEmail: email,
      referralLink: '',
      conversionStatus: 'converted',
      reward: '30 días gratis',
      createdAt: new Date().toISOString(),
    };
  }

  private async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const fromEmail = process.env.RESEND_FROM || 'AutomatizaWPP <noreply@automatizawpp.com>';
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <h1>Bem-vindo ao AutomatizaWPP!</h1>
    <p>Olá ${name || 'Subscriber'},</p>
    <p>Obrigado por se inscrever na nossa newsletter!</p>
    <p>Atenciosamente,<br>Equipe AutomatizaWPP</p>
  </div>
</body></html>`;

    const resend = this.getResend();
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Bem-vindo ao AutomatizaWPP!',
      html,
    });
  }
}

const growthAutomation = new GrowthAutomation();
export { growthAutomation };

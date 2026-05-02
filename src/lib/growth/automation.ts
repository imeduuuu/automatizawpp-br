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
  private resend: Resend | null = null;

  private getResend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    if (!this.resend) {
      this.resend = new Resend(apiKey);
    }
    return this.resend;
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
  <title>Boas-vindas ao AutomatizaWPP</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Bem-vindo ao AutomatizaWPP!</h1>
    <p>Olá ${name || 'Subscriber'},</p>
    <p>Obrigado por se inscrever na nossa newsletter!</p>
    <p>A partir de agora, você receberá atualizações e dicas exclusivas sobre automação de WhatsApp.</p>
    <p>Atenciosamente,<br>Equipe AutomatizaWPP</p>
  </div>
</body>
</html>
    `;

    try {
      const resend = this.getResend();
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Bem-vindo ao AutomatizaWPP!',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      throw error;
    }
  }
}

// Singleton instance
const growthAutomation = new GrowthAutomation();

export { growthAutomation };

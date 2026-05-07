import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { sendSmtpMail } from '@/lib/mail';
import { activateScaleBundleForUser } from '@/lib/services/catalog';
import { renderEmailTemplate } from '@/lib/email-templates';

const sectorValues = ['Restaurante', 'Clínica/Saúde', 'Salão de beleza', 'Imobiliária', 'E-commerce', 'Outro'] as const;
const planValues = ['scale', 'pro', 'starter'] as const;

const registerSchema = z.object({
  fullName: z.string().min(2),
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  sector: z.enum(sectorValues),
  problem: z.string().optional(),
  plan: z.enum(planValues).optional()
});

const TRIAL_DAYS = 14;

function addDays(from: Date, days: number) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

function generateRandomPassword() {
  return crypto.randomBytes(8).toString('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados de registro inválidos.' }, { status: 400 });
    }

    const { fullName, businessName, email: rawEmail, phone, sector, plan } = parsed.data;
    const normalizedEmail = rawEmail.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ ok: false, error: 'Este e-mail já está registrado.' }, { status: 409 });
    }

    const now = new Date();
    const trialEndsAt = addDays(now, TRIAL_DAYS);
    const generatedPassword = generateRandomPassword();
    const passwordHash = await hashPassword(generatedPassword);
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://automatizawpp.com';

    const user = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: businessName, timezone: 'America/Sao_Paulo' }
      });

      const createdUser = await tx.user.create({
        data: {
          workspaceId: workspace.id,
          email: normalizedEmail,
          name: fullName,
          role: 'client',
          passwordHash,
          trialStartedAt: now,
          trialEndsAt,
          subscriptionStatus: 'TRIAL',
          businessName,
          sector,
          phone
        }
      });

      await tx.lead.create({
        data: {
          workspaceId: workspace.id,
          ownerUserId: createdUser.id,
          fullName,
          email: normalizedEmail,
          phone,
          company: businessName,
          source: 'PUBLIC_REGISTER',
          productInterest: sector,
          status: 'NEW'
        }
      });

      await tx.subscriptionRequest.create({
        data: {
          userId: createdUser.id,
          plan: plan ?? 'scale',
          contactMethod: 'email',
          status: 'PENDING'
        }
      });

      await tx.auditLog.create({
        data: {
          userId: createdUser.id,
          workspaceId: workspace.id,
          email: normalizedEmail,
          event: 'USER_REGISTERED',
          metadata: { plan: plan ?? 'scale', sector, businessName }
        }
      });

      return createdUser;
    });

    let scaleBundleActivated = false;
    if (plan === 'scale') {
      try {
        await activateScaleBundleForUser(user.id);
        scaleBundleActivated = true;
      } catch (activationError) {
        console.warn('[register] scale bundle activation failed:', activationError);
      }
    }

    const { subject, html, text } = renderEmailTemplate('welcome', {
      name: fullName,
      businessName,
      trialEndsAt: trialEndsAt.toLocaleDateString('pt-BR'),
      password: generatedPassword,
      appUrl
    });

    const welcomeDelivery = await sendSmtpMail({ to: normalizedEmail, subject, html, text });
    if (!welcomeDelivery.ok) {
      console.warn('[register] welcome email not delivered:', welcomeDelivery.error);
    }

    return NextResponse.json({ ok: true, userId: user.id, scaleBundleActivated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

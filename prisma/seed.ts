import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';
import { WEBSITE_SERVICES } from '../src/lib/services/registry';

const prisma = new PrismaClient();
const ownerPassword = process.env.SEED_OWNER_PASSWORD;

async function main() {
  if (!ownerPassword) {
    throw new Error('SEED_OWNER_PASSWORD is required to run prisma seed safely.');
  }

  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo_workspace' },
    update: {},
    create: {
      id: 'demo_workspace',
      name: 'AutomatizaWPP Revenue Ops',
      timezone: 'Europe/Madrid'
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@automatizawpp.com' },
    update: {
      passwordHash: await hashPassword(ownerPassword)
    },
    create: {
      workspaceId: workspace.id,
      email: 'owner@automatizawpp.com',
      name: 'Revenue Owner',
      role: 'owner',
      passwordHash: await hashPassword(ownerPassword)
    }
  });

  await Promise.all(
    WEBSITE_SERVICES.map((service) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          publicCategory: service.publicCategory,
          icon: service.icon,
          sortOrder: service.sortOrder,
          active: true
        },
        create: {
          slug: service.slug,
          name: service.name,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          publicCategory: service.publicCategory,
          icon: service.icon,
          sortOrder: service.sortOrder,
          active: true
        }
      })
    )
  );

  const seededServices = await prisma.service.findMany({
    select: { id: true }
  });

  await prisma.clientServiceAccess.createMany({
    data: seededServices.map((service) => ({
      userId: owner.id,
      serviceId: service.id,
      status: 'ACTIVE'
    })),
    skipDuplicates: true
  });

  const sequence = await prisma.sequence.upsert({
    where: { id: 'seq_hot_lead' },
    update: {},
    create: {
      id: 'seq_hot_lead',
      workspaceId: workspace.id,
      name: 'Hot Lead Persistence',
      description: 'High-intent follow-up within first 72h',
      triggerType: 'high_intent'
    }
  });

  await prisma.sequenceStep.createMany({
    data: [
      {
        sequenceId: sequence.id,
        stepOrder: 1,
        channel: 'WHATSAPP',
        delayHours: 6,
        objective: 'Fast reconnection',
        template: 'Quick check-in after your inquiry. Want a 20-min strategy slot today?'
      },
      {
        sequenceId: sequence.id,
        stepOrder: 2,
        channel: 'EMAIL',
        delayHours: 24,
        objective: 'Proof + trust',
        template: 'Sharing a short case study relevant to your funnel goals.'
      }
    ],
    skipDuplicates: true
  });

  await prisma.lead.upsert({
    where: { id: 'lead_demo_1' },
    update: {},
    create: {
      id: 'lead_demo_1',
      workspaceId: workspace.id,
      ownerUserId: owner.id,
      fullName: 'Marta Lopez',
      email: 'marta@example.com',
      phone: '+34611111222',
      company: 'Clinica Dermaluz',
      source: 'Meta Ads',
      productInterest: 'AI Sales Automation',
      status: 'QUALIFYING',
      intentLevel: 'HIGH',
      urgencyLevel: 'HIGH',
      buyingStage: 'DISCOVERY',
      assignedSequenceId: sequence.id,
      leadScoreValue: 72,
      closeProbability: 0.58
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

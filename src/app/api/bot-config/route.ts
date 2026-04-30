import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  botName: z.string().min(2),
  welcomeMessage: z.string().min(5),
  businessHours: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dados de configuração inválidos.' }, { status: 400 });
    }

    const entries = [
      { key: 'bot.name', value: parsed.data.botName },
      { key: 'bot.welcomeMessage', value: parsed.data.welcomeMessage },
      { key: 'bot.businessHours', value: parsed.data.businessHours },
      { key: 'bot.status', value: 'PENDING_ACTIVATION' }
    ];

    await Promise.all(
      entries.map((entry) =>
        prisma.setting.upsert({
          where: {
            workspaceId_key: {
              workspaceId: user.workspaceId,
              key: entry.key
            }
          },
          update: { value: entry.value },
          create: {
            workspaceId: user.workspaceId,
            key: entry.key,
            value: entry.value,
            secure: false
          }
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

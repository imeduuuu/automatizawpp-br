'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { initialActionState, type ActionState } from '@/lib/actions/types';

const settingsSchema = z.object({
  timezone: z.string().min(3),
  language: z.string().min(2),
  notifications: z.enum(['enabled', 'disabled'])
});

export async function updateClientSettingsAction(_previousState: ActionState = initialActionState, formData: FormData): Promise<ActionState> {
  void _previousState;
  const session = await auth();
  if (!session?.user?.id || !session.user.workspaceId) {
    return {
      status: 'error',
      message: 'Sesion no valida. Vuelve a iniciar sesion.'
    };
  }

  const parsed = settingsSchema.safeParse({
    timezone: formData.get('timezone'),
    language: formData.get('language'),
    notifications: formData.get('notifications')
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revisa los datos de configuracion.'
    };
  }

  const entries = [
    { key: 'client.timezone', value: parsed.data.timezone },
    { key: 'client.language', value: parsed.data.language },
    { key: 'client.notifications', value: parsed.data.notifications }
  ];

  await Promise.all(
    entries.map((entry) =>
      prisma.setting.upsert({
        where: {
          workspaceId_key: {
            workspaceId: session.user.workspaceId,
            key: entry.key
          }
        },
        update: {
          value: entry.value
        },
        create: {
          workspaceId: session.user.workspaceId,
          key: entry.key,
          value: entry.value,
          secure: false
        }
      })
    )
  );

  await logAuditEvent({
    event: 'ACCOUNT_SETTINGS_UPDATED',
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
    email: session.user.email,
    metadata: parsed.data
  });

  return {
    status: 'success',
    message: 'Ajustes guardados correctamente.'
  };
}

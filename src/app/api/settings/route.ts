import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

const DEFAULT_SETTINGS = {
  workspaceName: 'AutomatizaWPP Workspace',
  language: 'es',
  brevoWebhookUrl: 'https://automatizawpp.com/api/webhooks/brevo',
  emailDomain: '',
  emailDkimSelector: '',
  callAlerts: 'enabled',
  followUpAlerts: 'enabled',
  accountName: 'Utilizador AutomatizaWPP',
  accountEmail: 'user@automatizawpp.com',
  accountCompany: 'AutomatizaWPP',
  accountPhone: ''
} as const;

const SETTINGS_KEYS = {
  language: 'client.language',
  brevoWebhookUrl: 'integration.brevoWebhookUrl',
  emailDomain: 'integration.emailDomain',
  emailDkimSelector: 'integration.emailDkimSelector',
  callAlerts: 'client.notifications.calls',
  followUpAlerts: 'client.notifications.followups',
  accountName: 'account.name',
  accountEmail: 'account.email',
  accountCompany: 'account.company',
  accountPhone: 'account.phone'
} as const;

function toSettingsObject(entries: Array<{ key: string; value: string }>) {
  const valueByKey = new Map(entries.map((entry) => [entry.key, entry.value]));
  return {
    language: valueByKey.get(SETTINGS_KEYS.language) ?? DEFAULT_SETTINGS.language,
    brevoWebhookUrl: valueByKey.get(SETTINGS_KEYS.brevoWebhookUrl) ?? DEFAULT_SETTINGS.brevoWebhookUrl,
    emailDomain: valueByKey.get(SETTINGS_KEYS.emailDomain) ?? DEFAULT_SETTINGS.emailDomain,
    emailDkimSelector: valueByKey.get(SETTINGS_KEYS.emailDkimSelector) ?? DEFAULT_SETTINGS.emailDkimSelector,
    callAlerts: valueByKey.get(SETTINGS_KEYS.callAlerts) ?? DEFAULT_SETTINGS.callAlerts,
    followUpAlerts: valueByKey.get(SETTINGS_KEYS.followUpAlerts) ?? DEFAULT_SETTINGS.followUpAlerts,
    accountName: valueByKey.get(SETTINGS_KEYS.accountName) ?? DEFAULT_SETTINGS.accountName,
    accountEmail: valueByKey.get(SETTINGS_KEYS.accountEmail) ?? DEFAULT_SETTINGS.accountEmail,
    accountCompany: valueByKey.get(SETTINGS_KEYS.accountCompany) ?? DEFAULT_SETTINGS.accountCompany,
    accountPhone: valueByKey.get(SETTINGS_KEYS.accountPhone) ?? DEFAULT_SETTINGS.accountPhone
  };
}

export async function GET() {
  const session = await getSession();
  if (!session?.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const [workspace, settings] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { name: true }
    }),
    prisma.setting.findMany({
      where: { workspaceId: session.workspaceId }
    })
  ]);

  return NextResponse.json({
    workspaceName: workspace?.name ?? DEFAULT_SETTINGS.workspaceName,
    ...toSettingsObject(settings)
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.workspaceId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Record<string, string>>;

  const workspaceName = body.workspaceName?.trim() || DEFAULT_SETTINGS.workspaceName;
  const updates = [
    { key: SETTINGS_KEYS.language, value: body.language?.trim() || DEFAULT_SETTINGS.language },
    { key: SETTINGS_KEYS.brevoWebhookUrl, value: body.brevoWebhookUrl?.trim() || DEFAULT_SETTINGS.brevoWebhookUrl },
    { key: SETTINGS_KEYS.emailDomain, value: body.emailDomain?.trim() || DEFAULT_SETTINGS.emailDomain },
    { key: SETTINGS_KEYS.emailDkimSelector, value: body.emailDkimSelector?.trim() || DEFAULT_SETTINGS.emailDkimSelector },
    { key: SETTINGS_KEYS.callAlerts, value: body.callAlerts?.trim() || DEFAULT_SETTINGS.callAlerts },
    { key: SETTINGS_KEYS.followUpAlerts, value: body.followUpAlerts?.trim() || DEFAULT_SETTINGS.followUpAlerts },
    { key: SETTINGS_KEYS.accountName, value: body.accountName?.trim() || DEFAULT_SETTINGS.accountName },
    { key: SETTINGS_KEYS.accountEmail, value: body.accountEmail?.trim() || DEFAULT_SETTINGS.accountEmail },
    { key: SETTINGS_KEYS.accountCompany, value: body.accountCompany?.trim() || DEFAULT_SETTINGS.accountCompany },
    { key: SETTINGS_KEYS.accountPhone, value: body.accountPhone?.trim() || DEFAULT_SETTINGS.accountPhone }
  ];

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: session.workspaceId },
      data: { name: workspaceName }
    }),
    ...updates.map((entry) =>
      prisma.setting.upsert({
        where: {
          workspaceId_key: {
            workspaceId: session.workspaceId,
            key: entry.key
          }
        },
        update: { value: entry.value },
        create: {
          workspaceId: session.workspaceId,
          key: entry.key,
          value: entry.value,
          secure: false
        }
      })
    )
  ]);

  return NextResponse.json({ ok: true });
}

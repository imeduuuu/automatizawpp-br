export type BirdInboundEvent = {
  type: string;
  workspace?: { id: string };
  channel?: { id: string; platform?: string };
  message?: {
    id: string;
    body?: { type: string; text?: { text: string } };
    createdAt?: string;
  };
  conversation?: { id: string };
  contact?: {
    id: string;
    displayName?: string;
    identifiers?: Array<{ key: string; value: string }>;
  };
  // legacy MessageBird shape
  body?: string;
  from?: string;
  subject?: string;
  to?: string;
  id?: string;
  conversationId?: string;
  createdDatetime?: string;
};

export type SalesOSInboundPayload = {
  workspaceId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'VOICE' | 'WEB_CHAT';
  message: string;
  subject?: string;
  threadRef?: string;
  messageId?: string;
  receivedAt?: string;
  lead: {
    fullName?: string;
    email?: string;
    phone?: string;
    source: string;
  };
  metadata: Record<string, unknown>;
};

function stripQuotedHistory(text: string): string {
  return text
    .split('\n')
    .filter(line => !line.startsWith('>') && !line.match(/^On .+ wrote:/))
    .join('\n')
    .trim();
}

function detectChannel(event: BirdInboundEvent): SalesOSInboundPayload['channel'] {
  const platform = event.channel?.platform?.toLowerCase() ?? '';
  if (platform.includes('email') || platform.includes('smtp')) return 'EMAIL';
  if (platform.includes('whatsapp') || platform.includes('wa')) return 'WHATSAPP';
  if (platform.includes('sms')) return 'SMS';
  if (platform.includes('voice') || platform.includes('call')) return 'VOICE';
  if (event.subject) return 'EMAIL';
  if (event.body && event.from?.includes('@')) return 'EMAIL';
  return 'WEB_CHAT';
}

function extractEmail(contact: BirdInboundEvent['contact']): string | undefined {
  return contact?.identifiers?.find(i => i.key === 'emailaddress')?.value
    ?? contact?.identifiers?.find(i => i.key === 'email')?.value;
}

function extractPhone(contact: BirdInboundEvent['contact']): string | undefined {
  return contact?.identifiers?.find(i => i.key === 'phonenumber')?.value
    ?? contact?.identifiers?.find(i => i.key === 'phone')?.value;
}

export function normalizeBirdEvent(
  event: BirdInboundEvent,
  defaultWorkspaceId: string
): SalesOSInboundPayload | null {
  // New Bird API shape
  if (event.message?.body) {
    const rawText = event.message.body.text?.text ?? '';
    const channel = detectChannel(event);
    const email = extractEmail(event.contact);
    const phone = extractPhone(event.contact);
    const source = channel === 'WHATSAPP' ? 'BIRD_WHATSAPP' : 'BIRD_EMAIL';

    return {
      workspaceId: defaultWorkspaceId,
      channel,
      message: stripQuotedHistory(rawText),
      subject: undefined,
      threadRef: event.conversation?.id,
      messageId: event.message.id,
      receivedAt: event.message.createdAt,
      lead: {
        fullName: event.contact?.displayName,
        email,
        phone,
        source
      },
      metadata: {
        provider: 'bird',
        from: email ?? phone,
        birdConversationId: event.conversation?.id,
        birdContactId: event.contact?.id,
        rawType: event.type
      }
    };
  }

  // Legacy MessageBird shape
  if (event.body) {
    const channel = detectChannel(event);
    const isEmail = channel === 'EMAIL';
    const source = isEmail ? 'BIRD_EMAIL' : 'BIRD_WHATSAPP';
    const fromEmail = isEmail ? event.from : undefined;
    const fromPhone = !isEmail ? event.from : undefined;

    return {
      workspaceId: defaultWorkspaceId,
      channel,
      message: stripQuotedHistory(event.body),
      subject: event.subject,
      threadRef: event.conversationId,
      messageId: event.id,
      receivedAt: event.createdDatetime,
      lead: {
        email: fromEmail,
        phone: fromPhone,
        source
      },
      metadata: {
        provider: 'bird',
        from: event.from,
        to: event.to,
        birdConversationId: event.conversationId
      }
    };
  }

  return null;
}

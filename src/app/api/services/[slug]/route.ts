import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { params } = context;
  const { slug } = await params;

  // Basic services endpoint
  const services: Record<string, any> = {
    'whatsapp': { id: 'whatsapp', name: 'WhatsApp' },
    'email': { id: 'email', name: 'Email' },
    'calls': { id: 'calls', name: 'Chamadas' }
  };

  const service = services[slug];
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  return NextResponse.json(service);
}

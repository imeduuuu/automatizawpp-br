import { redirect } from 'next/navigation';

export default async function ContatoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/leads/${id}`);
}

'use client';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return <div>Error: {error.message}</div>;
}
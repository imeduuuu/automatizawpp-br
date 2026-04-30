'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function SubmitButton({ label, pendingLabel = 'Salvando...', className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className || 'ds-button ds-button-primary'}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

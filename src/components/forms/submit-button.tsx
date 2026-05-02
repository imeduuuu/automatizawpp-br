'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

const baseStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: '#25D366',
  border: 'none',
  borderRadius: 6,
  color: '#060606',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const disabledStyle: React.CSSProperties = {
  ...baseStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
};

export function SubmitButton({ label, pendingLabel = 'Salvando...', className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={pending ? disabledStyle : baseStyle}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

import type { LeadStatus } from '@/lib/types';

type StatusPillProps = {
  status: LeadStatus;
};

type Tone = {
  background: string;
  color: string;
  opacity?: number;
};

const toneMap: Record<LeadStatus, Tone> = {
  NEW: { background: 'var(--bg)', color: 'var(--muted)' },
  CALL_SCHEDULED: { background: 'var(--text)', color: 'var(--surface)' },
  CALL_ATTEMPTED: { background: 'var(--text)', color: 'var(--surface)' },
  QUALIFIED: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  PROPOSAL_SENT: { background: 'var(--bg)', color: 'var(--muted)' },
  FOLLOW_UP: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  CLOSED_WON: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  CLOSED_LOST: { background: 'var(--bg)', color: 'var(--muted)', opacity: 0.7 },
  COLD: { background: 'var(--bg)', color: 'var(--muted)', opacity: 0.7 },
  CONTACTED: { background: 'var(--bg)', color: 'var(--muted)' },
  QUALIFYING: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  NURTURING: { background: 'var(--bg)', color: 'var(--muted)' },
  SALES_READY: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  NEGOTIATION: { background: 'var(--text)', color: 'var(--surface)' },
  BOOKED: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  WON: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  LOST: { background: 'var(--bg)', color: 'var(--muted)', opacity: 0.7 },
  PAUSED: { background: 'var(--bg)', color: 'var(--muted)' }
};

function labelFromStatus(status: string) {
  return status.replaceAll('_', ' ');
}

export function StatusPill({ status }: StatusPillProps) {
  const tone = toneMap[status];

  return (
    <span
      className="ds-status-pill"
      style={{
        background: tone.background,
        color: tone.color,
        opacity: tone.opacity ?? 1
      }}
    >
      {labelFromStatus(status)}
    </span>
  );
}

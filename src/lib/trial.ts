const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isSubscriptionActive(subscriptionStatus?: string | null) {
  const normalized = (subscriptionStatus || '').trim().toUpperCase();
  return normalized === 'ACTIVE' || normalized === 'STARTER' || normalized === 'PRO' || normalized === 'SCALE';
}

export function isTrialExpired(trialEndsAt?: Date | null, now = new Date()) {
  if (!trialEndsAt) {
    return false;
  }

  return trialEndsAt.getTime() < now.getTime();
}

export function getTrialDaysRemaining(trialEndsAt?: Date | null, now = new Date()) {
  if (!trialEndsAt) {
    return 14;
  }

  const diff = trialEndsAt.getTime() - now.getTime();
  if (diff <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(diff / DAY_IN_MS));
}

export function prettyPlanName(plan?: string | null) {
  const normalized = (plan || '').trim().toUpperCase();
  if (normalized === 'STARTER') return 'Starter';
  if (normalized === 'PRO') return 'Pro';
  if (normalized === 'SCALE') return 'Scale';
  if (normalized === 'ACTIVE') return 'Activo';
  return '';
}

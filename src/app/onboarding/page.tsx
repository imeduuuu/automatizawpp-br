import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/client/OnboardingFlow';
import { requireCurrentUser } from '@/lib/auth/session';
import { getTrialDaysRemaining, isSubscriptionActive } from '@/lib/trial';

export default async function OnboardingPage() {
  const user = await requireCurrentUser();

  if (isSubscriptionActive(user.subscriptionStatus)) {
    redirect('/dashboard');
  }

  return <OnboardingFlow trialDaysRemaining={getTrialDaysRemaining(user.trialEndsAt)} businessName={user.businessName} />;
}

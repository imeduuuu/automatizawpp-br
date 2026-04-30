export type ComplianceInput = {
  optedOut: boolean;
  dailyTouches: number;
  now?: Date;
  timezone?: string;
};

export function evaluateCompliance(input: ComplianceInput) {
  const maxTouchesPerDay = Number(process.env.MAX_TOUCHES_PER_DAY ?? '2');
  const quietStart = Number(process.env.QUIET_HOURS_START ?? '20');
  const quietEnd = Number(process.env.QUIET_HOURS_END ?? '8');
  const now = input.now ?? new Date();
  const hour = now.getHours();

  const quietHours = quietStart > quietEnd ? hour >= quietStart || hour < quietEnd : hour >= quietStart && hour < quietEnd;
  const blockedByFrequency = input.dailyTouches >= maxTouchesPerDay;
  const canContact = !input.optedOut && !blockedByFrequency && !quietHours;

  return {
    canContact,
    quietHours,
    blockedByFrequency,
    maxTouchesPerDay,
    reason: input.optedOut
      ? 'Lead opted out.'
      : blockedByFrequency
        ? `Exceeded ${maxTouchesPerDay} touches/day`
        : quietHours
          ? 'Within quiet hours'
          : 'Allowed'
  };
}

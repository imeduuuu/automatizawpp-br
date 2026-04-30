/**
 * GDPR Data Retention Policies for AutomatizaWPP.
 *
 * Per Spanish/EU GDPR (Art. 5(1)(e)): personal data shall be kept in a form
 * which permits identification of data subjects for no longer than is necessary
 * for the purposes for which the data is processed.
 *
 * Each table below has a retention window. After the window, records are either
 * deleted (hard) or anonymized (soft). The cron at /api/gdpr/purge runs daily.
 */

export type RetentionPolicy = {
  table: string;
  ageDays: number;
  strategy: 'hard_delete' | 'anonymize';
  description: string;
};

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    table: 'Message',
    ageDays: 730, // 2 years — business operational
    strategy: 'anonymize',
    description: 'Conversational message bodies. After 2y: scrub body, keep metadata.',
  },
  {
    table: 'CallTranscript',
    ageDays: 365, // 1 year
    strategy: 'anonymize',
    description: 'Call transcripts contain PII (voice → text). 1y is generous; many require 6m.',
  },
  {
    table: 'EmailEvent',
    ageDays: 365,
    strategy: 'hard_delete',
    description: 'Brevo open/click events. Useful for 1y of analytics.',
  },
  {
    table: 'LeadMemory',
    ageDays: 730,
    strategy: 'anonymize',
    description: 'AI memory about leads. Anonymize after 2y to keep training value w/o PII.',
  },
  {
    table: 'AuditLog',
    ageDays: 1095, // 3 years for legal evidence
    strategy: 'hard_delete',
    description: 'Audit log retention: 3y aligns with Spanish business law.',
  },
  {
    table: 'AgentRun',
    ageDays: 180,
    strategy: 'anonymize',
    description: 'Agent inputs/outputs may include PII in JSON. 6m is enough for ops debugging.',
  },
  {
    table: 'ToolCallLog',
    ageDays: 90,
    strategy: 'hard_delete',
    description: 'Detailed tool calls for ops. 90d sufficient for incident review.',
  },
  {
    table: 'SentinelError',
    ageDays: 180,
    strategy: 'hard_delete',
    description: 'Resolved errors after 6m no longer useful.',
  },
];

/**
 * Fields to anonymize on a Lead when erasure is requested by data subject.
 * Keeps the Lead row (referential integrity for stats) but scrubs all PII.
 */
export const LEAD_ANONYMIZATION_PATCH = {
  firstName: null,
  lastName: null,
  fullName: '[ERASED]',
  email: null,
  phone: null,
  company: null,
  campaign: null,
  productInterest: null,
} as const;

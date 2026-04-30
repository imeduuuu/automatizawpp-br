import { AgentContext } from '@/lib/agents/contracts';

export interface RoiInputs {
  leadVolumePeriod?: number;
  missedPercent?: number;
  averageDealValue?: number;
}

export interface RoiComputed {
  lostRevenue: number;
  recoveryLow: number;
  recoveryHigh: number;
}

export function extractRoiInputs(message: string): RoiInputs {
  const leadVolumeMatch = message.match(/(\d+)\s*(lead|leads|cliente|clientes)/i);
  const missedMatch = message.match(/(\d+)\s*%\s*(no|sin|without|missed|seguimiento)/i);
  const dealMatch = message.match(/(\d+)(?:€|K|EUR)/i);

  return {
    leadVolumePeriod: leadVolumeMatch ? parseInt(leadVolumeMatch[1], 10) : undefined,
    missedPercent: missedMatch ? parseInt(missedMatch[1], 10) : undefined,
    averageDealValue: dealMatch ? parseInt(dealMatch[1], 10) : undefined
  };
}

export function hasCompleteRoiInputs(inputs: RoiInputs): boolean {
  return !!(inputs.leadVolumePeriod && inputs.missedPercent !== undefined && inputs.averageDealValue);
}

export function hasRoiConfirmation(message: string): boolean {
  return /confirm|confirma|yes|si|ok|okay|exacto|correcto/i.test(message);
}

export function shouldTriggerRoiSalesMode(context: AgentContext): boolean {
  const hasRoiKeywords = /roi|revenue|margin|lost|opportunity|oportunidad/i.test(context.message ?? '');
  const hasHighScore = (context.lead.leadScoreValue ?? 0) >= 60;
  const hasHighIntent = context.lead.intentLevel === 'HIGH';

  return hasRoiKeywords && (hasHighScore || hasHighIntent);
}

export function computeRoi(inputs: RoiInputs): RoiComputed {
  const volume = inputs.leadVolumePeriod ?? 0;
  const missed = inputs.missedPercent ?? 0;
  const dealValue = inputs.averageDealValue ?? 0;

  const lostRevenue = (volume * missed * dealValue) / 100;
  const recoveryLow = lostRevenue * 0.3; // 30% recovery conservative
  const recoveryHigh = lostRevenue * 0.5; // 50% recovery optimistic

  return { lostRevenue, recoveryLow, recoveryHigh };
}

export function buildRoiMessage(inputs: RoiInputs, computed: RoiComputed): string {
  const formatCurrency = (val: number) => `${Math.round(val).toLocaleString('es-ES')}€`;

  return `Con ${inputs.leadVolumePeriod} leads, ${inputs.missedPercent}% sin seguimiento y ticket medio ${inputs.averageDealValue}€, estás dejando ${formatCurrency(computed.lostRevenue)} sobre la mesa.

Recuperando solo el 30-50% llegarías a ${formatCurrency(computed.recoveryLow)}-${formatCurrency(computed.recoveryHigh)} en margen adicional este trimestre.`;
}

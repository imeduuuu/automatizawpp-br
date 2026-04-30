import type { ScaleBundleServiceSlug } from '@/lib/services/registry';

export type ScaleBundleAccessStatus = 'active' | 'pending_activation' | 'upgrade_required';

export type BundleServiceAccess = {
  userId: string;
  workspaceId: string;
  serviceId: string;
  serviceSlug: ScaleBundleServiceSlug;
  accessId: string;
};

export type EmailScrapperResult = {
  email: string;
  isValid: boolean;
  domain: string;
  companyName?: string | null;
  confidence: number;
};

export type EmailScrapperStats = {
  count: number;
  qualified: number;
  validationRate: number;
  costPerLead: number;
  lastRunAt: string | null;
};

export type GoogleReviewData = {
  reviewId: string;
  authorName: string;
  rating: number;
  replyGenerated: string;
  replyPublished: boolean;
};

export type GoogleReviewsStats = {
  new: number;
  replied: number;
  replyRate: number;
  ratingChange: number;
  lastRunAt: string | null;
};

export type IcebreakerResult = {
  prospectId: string;
  prospectName: string;
  messageGenerated: string;
  messageSent: boolean;
};

export type IcebreakerStats = {
  sent: number;
  responses: number;
  responseRate: number;
  conversions: number;
  revenue: number;
  lastRunAt: string | null;
};

export type AlexRecommendation = {
  agentType: ScaleBundleServiceSlug;
  title: string;
  description: string;
  impactEstimate: 'bajo' | 'medio' | 'alto';
  autoExecutable: boolean;
};

export type AlexWeeklyReport = {
  week: string;
  emailStats: { count: number; qualified: number; costPerLead: number };
  reviewsStats: { new: number; replied: number; ratingChange: number };
  icebreakerStats: { sent: number; responses: number; responseRate: number };
  recommendations: AlexRecommendation[];
  summaryText: string;
};

export type AlexMonitorPayload = {
  status: 'healthy' | 'warning' | 'error';
  alerts: string[];
  recommendations: AlexRecommendation[];
  weeklyReport: AlexWeeklyReport | null;
};

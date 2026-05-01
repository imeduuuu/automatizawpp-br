/**
 * Token budget management for Claude API calls
 * Prevents budget overages with predictive counting
 */

// Approximate token counts (Claude tokenizer for accuracy)
const TOKENS_PER_1K_CHARS = 250; // ~4 chars per token

export interface TokenBudget {
  model: string;
  maxTokens: number;
  currentUsed: number;
  reserve: number; // Keep reserve for safety
}

const DEFAULT_BUDGETS: Record<string, number> = {
  "claude-opus-4-7": 100000,
  "claude-sonnet-4-6": 100000,
  "claude-haiku-4-5-20251001": 50000,
};

const RESERVE_TOKENS = 500; // Safety buffer

/**
 * Estimate token count from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if enough budget for operation
 */
export function canAfford(
  text: string,
  budget: TokenBudget,
  headroom: number = RESERVE_TOKENS
): boolean {
  const needed = estimateTokens(text);
  const available = budget.maxTokens - budget.currentUsed - headroom;
  return needed <= available;
}

/**
 * Get remaining budget
 */
export function getRemaining(budget: TokenBudget): number {
  return Math.max(0, budget.maxTokens - budget.currentUsed - budget.reserve);
}

/**
 * Create budget tracker for a model
 */
export function createBudget(
  model: string = "claude-haiku-4-5-20251001",
  maxTokens?: number
): TokenBudget {
  return {
    model,
    maxTokens: maxTokens || DEFAULT_BUDGETS[model] || 50000,
    currentUsed: 0,
    reserve: RESERVE_TOKENS,
  };
}

/**
 * Record token usage
 */
export function recordUsage(budget: TokenBudget, inputTokens: number, outputTokens: number): void {
  budget.currentUsed += inputTokens + outputTokens;
}

/**
 * Reset budget (for next request cycle)
 */
export function resetBudget(budget: TokenBudget): void {
  budget.currentUsed = 0;
}

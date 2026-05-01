import { Anthropic } from "@anthropic-ai/sdk";
import { TokenBudget, recordUsage } from "./tokens";

export interface AgentExecutionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  budget?: TokenBudget;
  timeout?: number;
}

/**
 * Execute an agent with unified interface across providers
 */
export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  options: AgentExecutionOptions = {}
) {
  const {
    model = "claude-haiku-4-5-20251001",
    temperature = 0.7,
    maxTokens = 2000,
    timeout = 30000,
  } = options;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout,
  });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    if (options.budget) {
      recordUsage(options.budget, response.usage.input_tokens, response.usage.output_tokens);
    }

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error(`Unexpected content type: ${content.type}`);
    }

    return {
      success: true,
      content: content.text,
      usage: response.usage,
      model,
      stopReason: response.stop_reason,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      content: null,
      error: message,
      model,
      usage: null,
    };
  }
}

/**
 * Run agent with retries on transient failures
 */
export async function runAgentWithRetry(
  systemPrompt: string,
  userMessage: string,
  options: AgentExecutionOptions & { retries?: number } = {}
) {
  const { retries = 2, ...runOptions } = options;

  for (let i = 0; i <= retries; i++) {
    const result = await runAgent(systemPrompt, userMessage, runOptions);

    if (result.success) {
      return result;
    }

    if (i < retries && !result.error?.includes("authentication")) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      continue;
    }

    return result;
  }

  return {
    success: false,
    content: null,
    error: "Max retries exceeded",
    model: runOptions.model,
    usage: null,
  };
}

/**
 * Batch execute multiple agents (with concurrency limit)
 */
export async function runAgentBatch(
  agents: Array<{
    system: string;
    message: string;
    id?: string;
  }>,
  options: AgentExecutionOptions & { concurrency?: number } = {}
) {
  const { concurrency = 3, ...runOptions } = options;

  const results = await Promise.all(
    agents.map(async (agent, idx) => {
      const result = await runAgent(agent.system, agent.message, runOptions);
      return {
        id: agent.id || String(idx),
        ...result,
      };
    })
  );

  return results;
}

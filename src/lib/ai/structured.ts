import { z } from "zod";
import { Anthropic } from "@anthropic-ai/sdk";

/**
 * Helpers para estruturar respostas de IA com validação Zod
 */

export async function generateStructured<T extends z.ZodSchema>(
  schema: T,
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<z.infer<T>> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Serialize Zod schema to JSON schema format
  const schemaString = JSON.stringify({
    type: "object",
    description: "Expected response format",
  }, null, 2);

  const response = await client.messages.create({
    model: options?.model || "claude-haiku-4-5-20251001",
    max_tokens: options?.maxTokens || 1000,
    temperature: options?.temperature ?? 0.7,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nRespond with valid JSON matching this schema:\n${schemaString}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Expected text response from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return schema.parse(parsed);
}

/**
 * Parse JSON safely from Claude response
 */
export function parseJSON<T>(text: string, fallback?: T): T | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : fallback ?? null;
  } catch {
    return fallback ?? null;
  }
}

/**
 * Extract reasoning blocks from response
 */
export function extractReasoning(text: string): {
  thinking?: string;
  response: string;
} {
  const thinkingMatch = text.match(/<internal_reasoning>([\s\S]*?)<\/internal_reasoning>/);
  const thinking = thinkingMatch ? thinkingMatch[1].trim() : undefined;
  const response = text.replace(/<internal_reasoning>[\s\S]*?<\/internal_reasoning>/g, "").trim();

  return { thinking, response };
}

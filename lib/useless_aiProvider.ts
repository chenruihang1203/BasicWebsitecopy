/**
 * Unified AI Model Provider
 * 
 * ENCAPSULATION PATTERN:
 * This class abstracts both Qwen and DeepSeek models from ModelScope
 * with a consistent interface. All model names are centrally managed here.
 * 
 * Core Workflow:
 * 1. Input: Model name M (qwen | deepseek)
 * 2. Provider creates appropriate client for model M
 * 3. Model M generates responses using its specific characteristics
 * 4. Consistent API regardless of underlying model
 * 
 * Key Design Principles:
 * - Single source of truth for model IDs (getDefaultModelId)
 * - Unified interface for both streaming (chat) and generation (prompts)
 * - Easy extensibility for adding new ModelScope models
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';

export type ModelType = 'qwen' | 'deepseek';

interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
}

interface StreamOptions {
  system: string;
  messages: any[];
  temperature?: number;
  maxOutputTokens?: number;
}

interface GenerateOptions {
  system: string;
  messages: any[];
  prompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * AIModelProvider - Unified interface for both Qwen and DeepSeek
 */
export class AIModelProvider {
  private modelType: ModelType;
  private modelId: string;
  client: ReturnType<typeof createOpenAI>;
  private config: AIProviderConfig;

  constructor(modelType: ModelType, config: AIProviderConfig, modelId?: string) {
    this.modelType = modelType;
    this.config = config;
    this.client = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    // Set model ID based on type if not provided
    this.modelId = modelId || this.getDefaultModelId(modelType);
  }

  private getDefaultModelId(modelType: ModelType): string {
    switch (modelType) {
      case 'qwen':
        return 'Qwen/Qwen2.5-7B-Instruct';
      case 'deepseek':
        return 'deepseek-ai/DeepSeek-R1-0528';
      default:
        return 'Qwen/Qwen2.5-7B-Instruct';
    }
  }

  /**
   * Stream text response (for chat interactions)
   */
  async stream(options: StreamOptions & { onFinish?: (result: { text: string; finishReason: string }) => Promise<void> }) {
    const model = this.client.chat(this.modelId);

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      maxOutputTokens: options.maxOutputTokens ?? 250,
      onFinish: options.onFinish,
    });
  }

  /**
   * Generate text response (for non-streaming, e.g., prompt generation)
   */
  async generate(options: GenerateOptions): Promise<string> {
    const model = this.client.chat(this.modelId);

    // Use provided prompt if available, otherwise format messages into prompt
    const promptText = options.prompt || this.formatMessagesToPrompt(options.messages);

    const { text } = await generateText({
      model,
      system: options.system,
      prompt: promptText,
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 800,
    });

    return text;
  }

  /**
   * Convert messages to a simple prompt string for generateText
   */
  private formatMessagesToPrompt(messages: any[]): string {
    if (!Array.isArray(messages) || messages.length === 0) {
      return '';
    }

    return messages
      .map((msg: any) => {
        if (typeof msg === 'object' && 'content' in msg) {
          const content =
            typeof msg.content === 'string'
              ? msg.content
              : Array.isArray(msg.content)
              ? msg.content.map((c: any) => (typeof c === 'object' && 'text' in c ? c.text : '')).join(' ')
              : '';
          return `${msg.role}: ${content}`;
        }
        return '';
      })
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  /**
   * Get model type identifier
   */
  getModelType(): ModelType {
    return this.modelType;
  }

  /**
   * Get model ID
   */
  getModelId(): string {
    return this.modelId;
  }
}

/**
 * Factory function to create provider with environment variables
 */
export function createAIProvider(modelType: ModelType): AIModelProvider | null {
  const apiKey = process.env.MODELSCOPE_API_KEY;
  const baseUrl = process.env.MODELSCOPE_BASE_URL;

  if (!apiKey || !baseUrl) {
    return null;
  }

  return new AIModelProvider(modelType, { apiKey, baseUrl });
}

/**
 * Get provider for both models
 */
export function getBothProviders(): {
  qwen: AIModelProvider | null;
  deepseek: AIModelProvider | null;
} {
  return {
    qwen: createAIProvider('qwen'),
    deepseek: createAIProvider('deepseek'),
  };
}

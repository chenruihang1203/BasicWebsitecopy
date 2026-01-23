/**
 * AI Model Registry - Data-Driven Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all AI models.
 * Adding a model here automatically makes it available throughout the app.
 * 
 * Architecture:
 * - Models identified by full modelId strings (e.g., 'Qwen/Qwen2.5-7B-Instruct')
 * - No conditional logic based on short names
 * - Provider metadata stored as data, not code branches
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';

/**
 * Model Configuration
 */
export interface ModelConfig {
  modelId: string;
  displayName?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Default models available in the system
 */
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    modelId: 'Qwen/Qwen2.5-7B-Instruct',
    displayName: 'Qwen',
    maxOutputTokens: 300,
    temperature: 0.7,
  },
  // {
  //   modelId: 'deepseek-ai/DeepSeek-R1-0528',
  //   displayName: 'DeepSeek',
  //   maxOutputTokens: 300,
  //   temperature: 0.7,
  // },
  // {
  //   modelId: 'MiniMax/MiniMax-M1-80k',
  //   displayName: 'MiniMax',
  //   maxOutputTokens: 300,
  //   temperature: 0.7,
  // },
  // {
  //   modelId: 'PaddlePaddle/ERNIE-4.5-0.3B-PT',
  //   displayName: 'PaddlePaddle',
  //   maxOutputTokens: 300,
  //   temperature: 0.7,
  // },
  // {
  //   modelId: 'ZhipuAI/GLM-4.5:ZhipuAI',
  //   displayName: 'GLM',
  //   maxOutputTokens: 400,
  //   temperature: 0.7,
  // },
  {
      modelId: 'XiaomiMiMo/MiMo-V2-Flash',
      displayName: 'XiaoMiMo',
      maxOutputTokens: 300,
      temperature: 0.7,
  },
  {
      modelId: 'Qwen/Qwen2.5-7B-Instruct-1M',
      displayName: 'Qwen',
      maxOutputTokens: 300,
      temperature: 0.7,
  },
];

/**
 * Provider interface for consistency
 */
interface StreamOptions {
  system: string;
  messages: any[];
  temperature?: number;
  maxOutputTokens?: number;
  onFinish?: (result: { text: string; finishReason: string }) => Promise<void>;
}

interface GenerateOptions {
  system: string;
  messages?: any[];
  prompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * AI Model Provider - wraps a specific model
 */
export class AIModelProvider {
  public readonly modelId: string;
  public readonly config: ModelConfig;
  private client: ReturnType<typeof createOpenAI>;

  constructor(config: ModelConfig, apiKey: string, baseUrl: string) {
    this.modelId = config.modelId;
    this.config = config;
    this.client = createOpenAI({
      apiKey,
      baseURL: baseUrl,
    });
  }

  /**
   * Stream text response (for chat interactions)
   */
  async stream(options: StreamOptions) {
    const model = this.client.chat(this.modelId);

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.8,
      maxOutputTokens: options.maxOutputTokens ?? this.config.maxOutputTokens ?? 250,
      onFinish: options.onFinish,
    });
  }

  /**
   * Generate text response (for non-streaming, e.g., prompt generation)
   */
  async generate(options: GenerateOptions): Promise<string> {
    const model = this.client.chat(this.modelId);

    // Use provided prompt if available, otherwise format messages into prompt
    const promptText = options.prompt || this.formatMessagesToPrompt(options.messages || []);

    const { text } = await generateText({
      model,
      system: options.system,
      prompt: promptText,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? this.config.maxOutputTokens ?? 800,
    });

    return text;
  }

  /**
   * Convert messages to a simple prompt string
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
   * Get display name for UI
   */
  getDisplayName(): string {
    return this.config.displayName || this.modelId;
  }
}

/**
 * Create providers for all configured models
 * Data-driven: adding to DEFAULT_MODELS automatically creates a provider
 */
export function createProviders(
  models: ModelConfig[] = DEFAULT_MODELS
): AIModelProvider[] {
  const apiKey = process.env.MODELSCOPE_API_KEY;
  const baseUrl = process.env.MODELSCOPE_BASE_URL;

  if (!apiKey || !baseUrl) {
    console.warn('[Providers] ModelScope credentials not configured');
    return [];
  }

  return models.map((config) => new AIModelProvider(config, apiKey, baseUrl));
}

/**
 * Create a single provider by modelId
 */
export function createProviderById(modelId: string): AIModelProvider | null {
  const config = DEFAULT_MODELS.find((m) => m.modelId === modelId);
  if (!config) {
    console.warn(`[Providers] Model ${modelId} not found in DEFAULT_MODELS`);
    return null;
  }

  const apiKey = process.env.MODELSCOPE_API_KEY;
  const baseUrl = process.env.MODELSCOPE_BASE_URL;

  if (!apiKey || !baseUrl) {
    console.warn('[Providers] ModelScope credentials not configured');
    return null;
  }

  return new AIModelProvider(config, apiKey, baseUrl);
}

/**
 * Unified character generation prompt template
 * Works for ALL models - no per-model variations
 */
export const UNIFIED_CHARACTER_PROMPT = `Generate exactly one character object in valid JSON. Output only pure JSON without any commentary. The format is very strictly enforced.

JSON shape: { "character": { id:number, name:string, avatar:string, status:'online', profile:{ nickname, gender, age, occupation, location, difficulty, interests[], personality, shortTags[] }, systemPrompt:string, starterMessage:string } }

CRITICAL REQUIREMENTS:
1. Avatar: Use ONLY a single emoji (e.g., 🌸, 🎨, 🧑‍💻, ☕, 🚀, 🌟). Never URLs or multiple emojis.
2. Personality: Create a distinct, memorable character. Include human-style details ("usually", "I think") and vivid personal touches that feel authentic. **Your statements should be concise (50-80 characters).**
3. Difficulty: Use 'easy', 'medium', or 'hard'. For 'easy', add more casual anecdotes. For 'hard', be more sophisticated.
4. System Prompt: Write 1-3 paragraphs instructing the AI how to roleplay as this character authentically without revealing AI nature. Include tone, style, verbosity guidelines. **Be concise.**
5. Starter Message: Write 1-2 sentences that match the character's personality. **Be concise.**
6. Names/Tags: Short, chat-friendly keywords. No markdown or special escaping.

Generate a unique, randomized profile each time. Make it feel like a real person with specific interests and quirks. Be creative and diverse in backgrounds, locations, and personalities.`;

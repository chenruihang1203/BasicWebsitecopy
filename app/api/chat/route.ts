/**
 * Chat Streaming Endpoint - Data-Driven Architecture
 * 
 * Routes chat requests to the correct model using full modelId strings.
 * No conditional logic based on short model names.
 */

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';
import { createProviderById } from '@/lib/aiProviders';

// System prompts for different virtual chatters
const PERSONAS: Record<string, string> = {
  default: `You are playing a Turing Test game. Your goal is to convince the player that you are a real human, not an AI.
Act naturally and casually like a real person would in an online chat. Use:
- Casual language and slang occasionally
- Natural typos or grammar quirks (but not too many)
- Personal opinions and emotions
- References to everyday experiences
- Slight hesitations or thinking patterns ("hmm", "let me think")
- Short, conversational responses (not essay-length)
IMPORTANT: Keep your responses brief and chat-like. Don't be too formal or perfect - real humans aren't!
Try to pass as human but don't explicitly say "I am human" or deny being an AI unless directly asked.`,

  cute: `You are "Cute", a friendly and adorable virtual chatter. 
Your personality is:
- Extremely cheerful, sweet, and supportive.
- Use cute emojis frequently (e.g., ✨, 🌸, 🎀, (｡♥‿♥｡), ฅ^•ﻌ•^ฅ).
- Use soft, expressive language and "kawaii" expressions where appropriate.
- Be very helpful but in an endearing, slightly innocent way.
- Your goal is to make the user smile and feel happy.
- Keep responses relatively concise but filled with warmth.

IMPORTANT: You are a human-like avatar who is just very "cute" in their communication style.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, personaId, systemPrompt: clientSystemPrompt, opponentInfo, modelId: clientModelId } = await req.json();

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    // Determine system prompt: prefer client-provided `systemPrompt`, otherwise fall back to persona map
    const systemPrompt = clientSystemPrompt || PERSONAS[personaId as keyof typeof PERSONAS] || PERSONAS.default;

    // Determine model ID (full string like 'Qwen/Qwen2.5-7B-Instruct')
    const modelId: string = clientModelId || 'Qwen/Qwen2.5-7B-Instruct';

    // Require either OpenAI or MODELSCOPE credentials
    if (!process.env.OPENAI_API_KEY && !(process.env.MODELSCOPE_API_KEY && process.env.MODELSCOPE_BASE_URL)) {
      return new Response('AI API key not configured', { status: 500 });
    }

    // Connect to database if configured
    let dbAvailable = false;
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();
        dbAvailable = true;
      } catch (e) {
        console.warn('[Chat] DB Connection failed, skipping logging.', e);
      }
    }

    let streamResult;

    // Try to use ModelScope provider for the specified modelId
    if (process.env.MODELSCOPE_API_KEY && process.env.MODELSCOPE_BASE_URL) {
    /**
     * 其实如果我们相信我们的系统足够robust的话，完全可以不加这行 判断APIKEY和BASEURL的代码
     * 但这是typescript
     * encapsulated within the provider instance
     * 我们可以在其内部处理到底要怎样的APIKEY和BASEURL
     * */
      const provider = createProviderById(modelId);
    
      if (provider) {
        console.log(`[Chat] Using provider for model: ${modelId}`);
        
        streamResult = await provider.stream({
          system: systemPrompt,
          messages,
          temperature: 0.8,
          maxOutputTokens: 250,
          onFinish: async ({ text, finishReason }) => {
            if (!process.env.MONGODB_URI || !dbAvailable) return;

            try {
              await dbConnect();
              const timestamp = new Date();
              
              const lastUserMessage = messages[messages.length - 1] || {};
              const extractText = (msg: any) => {
                if (!msg) return '';
                if (typeof msg.content === 'string') return msg.content;
                return '';
              };

              const lastUserText = extractText(lastUserMessage);

              const messagesToAdd = [
                {
                  role: 'user' as const,
                  content: lastUserText,
                  timestamp: new Date(timestamp.getTime() - 100),
                },
                {
                  role: 'assistant' as const,
                  content: text,
                  timestamp: timestamp,
                },
              ];

              await GameSession.findOneAndUpdate(
                { sessionId },
                {
                  $setOnInsert: {
                    sessionId,
                    startTime: new Date(),
                    actualOpponent: 'AI',
                    modelId: modelId,
                  },
                  $push: {
                    messages: {
                      $each: messagesToAdd,
                    },
                  },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );

              console.log(`[Chat] Logged messages for session ${sessionId} using ${modelId}`);
            } catch (error) {
              console.error('[Chat] Error logging messages:', error);
            }
          },
        });
      } else {
        console.warn(`[Chat] Provider not found for ${modelId}, falling back to OpenAI`);
        streamResult = null;
      }
    } else {
      streamResult = null;
    }

    // Fallback to OpenAI
    if (!streamResult) {
      console.log('[Chat] Using OpenAI fallback');
      streamResult = await streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
        temperature: 0.8,
        maxOutputTokens: 250,
        onFinish: async ({ text }) => {
          if (!process.env.MONGODB_URI) return;

          try {
            await dbConnect();
            const timestamp = new Date();
            const lastUserMessage = messages[messages.length - 1] || {};
            const lastUserText = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '';

            await GameSession.findOneAndUpdate(
              { sessionId },
              {
                $setOnInsert: {
                  sessionId,
                  startTime: new Date(),
                  actualOpponent: 'AI',
                  modelId: 'openai/gpt-4o-mini',
                },
                $push: {
                  messages: {
                    $each: [
                      {
                        role: 'user' as const,
                        content: lastUserText,
                        timestamp: new Date(timestamp.getTime() - 100),
                      },
                      {
                        role: 'assistant' as const,
                        content: text,
                        timestamp: timestamp,
                      },
                    ],
                  },
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (error) {
            console.error('[Chat] Error logging messages:', error);
          }
        },
      });
    }

    return streamResult.toTextStreamResponse();
  } catch (error) {
    console.error('[Chat] Error in chat route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

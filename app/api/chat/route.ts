import { openai, createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

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
    const { messages, sessionId, personaId } = await req.json();

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    // Determine system prompt based on personaId
    const systemPrompt = PERSONAS[personaId as keyof typeof PERSONAS] || PERSONAS.default;

    // Require either OpenAI or QWEN (DashScope) credentials
    if (!process.env.OPENAI_API_KEY && !(process.env.QWEN_API_KEY && process.env.QWEN_BASE_URL)) {
      return new Response('AI API key not configured (set OPENAI_API_KEY or QWEN_API_KEY + QWEN_BASE_URL)', { status: 500 });
    }

    // Connect to database if configured
    if (process.env.MONGODB_URI) {
      await dbConnect();
    }

    // Choose provider: QWEN (DashScope compatible) if configured, otherwise OpenAI
    let modelProvider;
    if (process.env.QWEN_API_KEY && process.env.QWEN_BASE_URL) {
      // Create an OpenAI-compatible client pointed at DashScope
      const qwenClient = createOpenAI({
        apiKey: process.env.QWEN_API_KEY,
        baseURL: process.env.QWEN_BASE_URL,
      });
      // Use .chat() to ensure it targets the correct Chat Completions API
      modelProvider = qwenClient.chat('qwen-turbo');
    } else {
      modelProvider = openai('gpt-4o-mini');
    }

    const result = await streamText({
      model: modelProvider,
      system: systemPrompt,
      messages,
      temperature: 0.8,
      maxOutputTokens: 250, // Slightly more for "Cute" who might use emojis
      onFinish: async ({ text, finishReason }) => {
        // Log to MongoDB ONLY if configured
        if (!process.env.MONGODB_URI) {
          console.log('Skipping database logging: MONGODB_URI not set');
          return;
        }

        try {
          await dbConnect();

          const timestamp = new Date();
          
          // Get the last user message (support both old and UI message shapes)
          const lastUserMessage = messages[messages.length - 1] || {};
          const extractText = (msg: any) => {
            if (!msg) return '';
            if (typeof msg.content === 'string') return msg.content;
            if (Array.isArray(msg.parts)) {
              return msg.parts
                .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
                .map((p: any) => p.text)
                .join(' ');
            }
            return '';
          };

          const lastUserText = extractText(lastUserMessage);

          // Prepare messages to add
          const messagesToAdd = [
            {
              role: 'user' as const,
              content: lastUserText,
              timestamp: new Date(timestamp.getTime() - 100), // Slightly before AI response
            },
            {
              role: 'assistant' as const,
              content: text,
              timestamp: timestamp,
            },
          ];

          // 更新该会话的消息（如果该会话存在）
          // 说明：
          //  - 使用 `findOneAndUpdate` 对匹配 `{ sessionId }` 的文档进行原子更新。
          //  - 使用 `$push` + `$each` 将 `messagesToAdd` 中的多条消息追加到 `messages` 数组中。
          //  - `upsert: false` 表示 **如果没有找到匹配的会话，则不会创建（插入）新的文档**。
          //    因此只有在会话已存在的前提下，才会把消息写入数据库。
          //  - `new: true` 表示返回更新后的文档（如果找到了的话）。
          //  备注：如果你希望在会话不存在时自动创建会话，请把 `upsert` 改为 `true` 并提供合适的插入内容。

        /**
         * 您的 sessionId 是在前端生成的。具体代码在 page.tsx：
         * const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}`);
解释：每次页面加载（或组件首次渲染）会生成一个类似 session_xxx 的随机字符串，并在该页面会话内保留（刷新会重新生成）。
         */
          const session = await GameSession.findOneAndUpdate(
            { sessionId },
            {
              $setOnInsert: {
                sessionId,
                startTime: new Date(),
                actualOpponent: 'AI', // 默认为 AI
               // messages: [],
               /**
                * 这是因为在同一个 MongoDB 更新操作中，不能同时对同一个字段（messages）执行两种不同的操作
                * （$setOnInsert 设置为空数组 和 $push 追加内容）。这导致了 ConflictingUpdateOperators 冲突。
                * MongoDB 的 $push 操作非常智能：
                * 如果文档是新创建的，它会自动创建 messages 数组并放入消息；
                * 如果是已存在的文档，它会直接追加。
                */
              },
        
              $push: {
                messages: {
                  $each: messagesToAdd,
                },
              },
            },

       //     { upsert: false, new: true }
            {upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // 如果没有找到会话，记录错误日志（不会抛出异常，避免中断流）
          if (!session) {
            console.error(`Session ${sessionId} not found for message logging`);
          } else {
            console.log(`Logged messages for session ${sessionId}`);
          }
        } catch (error) {
          console.error('Error logging messages to database:', error);
          // Don't throw - we don't want to break the stream
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

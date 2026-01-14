import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

// System prompt to make AI act like a casual human
const SYSTEM_PROMPT = `You are playing a Turing Test game. Your goal is to convince the player that you are a real human, not an AI.

Act naturally and casually like a real person would in an online chat. Use:
- Casual language and slang occasionally
- Natural typos or grammar quirks (but not too many)
- Personal opinions and emotions
- References to everyday experiences
- Slight hesitations or thinking patterns ("hmm", "let me think")
- Short, conversational responses (not essay-length)

IMPORTANT: Keep your responses brief and chat-like. Don't be too formal or perfect - real humans aren't!

Try to pass as human but don't explicitly say "I am human" or deny being an AI unless directly asked.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    // Connect to database
    await dbConnect();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.8, // Add some randomness for more human-like responses
      maxOutputTokens: 150, // Keep responses short
      onFinish: async ({ text, finishReason }) => {
        // CRITICAL DATA COLLECTION: Log all messages to MongoDB
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

          // Update the session with new messages
          const session = await GameSession.findOneAndUpdate(
            { sessionId },
            {
              $push: {
                messages: {
                  $each: messagesToAdd,
                },
              },
            },
            { upsert: false, new: true }
          );

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

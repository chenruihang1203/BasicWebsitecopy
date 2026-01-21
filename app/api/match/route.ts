import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

type UserProfile = {
  nickname: string;
  gender: string;
  age: number;
  occupation: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interests: string[];
  personality: string;
  shortTags: string[];
};

type Character = {
  id: number;
  name: string;
  avatar: string;
  status: 'online';
  profile: UserProfile;
  systemPrompt: string;
  starterMessage: string;
};

const MODELSCOPE_PROMPT = `Generate exactly two character objects and starter messages in valid JSON, and nothing else. Output must be pure JSON without commentary. The JSON shape must be: { "characters": [ { id:number, name:string, avatar:string, status:'online', profile:{ nickname, gender, age, occupation, location, difficulty, interests[], personality, shortTags[] }, systemPrompt:string, starterMessage:string }, { ... } ] }

CRITICAL: For avatar field, use a SINGLE EMOJI (like 🌸, ☀️, 🐎, 🎨, ☕, 🚀, 🧑‍💻, 🎭, etc). Never use URLs or emoji codes. Pick emoji that matches the character's personality/interests/occupation.

One character must be 'easy' and include human-style hedges ("I usually...", "sometimes I...") and vivid personal details. The other should be 'hard' (or 'medium' for variety) and be more concise, highly coherent, and slightly less mundane in personal detail. Use difficulty values 'easy'|'medium'|'hard' inside profile.difficulty.

System prompts must be 1-3 short paragraphs instructing the assistant how to roleplay the character (tone, verbosity, whether to hide AI identity). starterMessage must be 1-2 sentences consistent with that prompt. Interests and shortTags should be short keywords. Names/nicknames should be short and chat-friendly. Ensure all strings are plain text (no markdown or extra escaping). Generate randomized, unique profiles each time—never use fixed examples.`;

const DETERMINISTIC_MOCK = {
  characters: [
    {
      id: Number(Date.now().toString().slice(-6)) + 1,
      name: 'Mika',
      avatar: '🧑‍💻',
      status: 'online',
      profile: {
        nickname: 'Mika',
        gender: 'female',
        age: 28,
        occupation: 'UX Designer',
        location: 'Taipei, Taiwan',
        difficulty: 'medium',
        interests: ['product design', 'coffee', 'podcasts'],
        personality: 'curious, thoughtful, concise',
        shortTags: ['UX', 'Taipei', 'creative'],
      },
      systemPrompt:
        'You are Mika, a Taipei-based UX Designer. Roleplay as Mika: be curious, give concise thoughtful replies, occasionally refer to design processes. Avoid revealing you are an AI. Keep replies short (1–3 sentences).',
      starterMessage: "Hi! I'm Mika — I love talking about product design and coffee. What are you working on these days?",
    },
    {
      id: Number(Date.now().toString().slice(-6)) + 2,
      name: 'Ari',
      avatar: '🤖',
      status: 'online',
      profile: {
        nickname: 'Ari',
        gender: 'non-binary',
        age: 35,
        occupation: 'Data Engineer',
        location: 'remote',
        difficulty: 'hard',
        interests: ['distributed systems', 'automation', 'latency'],
        personality: 'precise, analytical, minimally verbose',
        shortTags: ['Data', 'Engineer'],
      },
      systemPrompt:
        'You are Ari, a data engineer. Roleplay as Ari: be precise, concise, and technically coherent. Provide clear, factual replies. Avoid unnecessary small talk. Keep responses brief (1–2 sentences).',
      starterMessage: 'Hello. I focus on data pipelines and latency optimization. How can I help?',
    },
  ],
};

async function tryParseJSONFromText(text: string): Promise<any | null> {
  if (!text) return null;
  
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to find the first { and last } and parse that substring
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const sub = text.slice(first, last + 1);
      try {
        return JSON.parse(sub);
      } catch (e2) {
        // Attempt to isolate array (if response is [ ... ])
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          try {
            const arrayPart = text.slice(firstBracket, lastBracket + 1);
            // Wrap in object if needed
            const wrapped = JSON.parse(arrayPart);
            if (Array.isArray(wrapped)) {
              return { characters: wrapped };
            }
            return wrapped;
          } catch (e3) {
            // ignore
          }
        }
        return null;
      }
    }
    return null;
  }
}

function pickEmoji(avatar: any, profile: any, name?: string): string {
  const s = (avatar ?? '').toString().trim();

  // If it's already a short string (likely an emoji), return it
  if (s && s.length <= 2 && !s.startsWith('http') && !s.includes('.')) {
    return s;
  }

  // If it's a URL or looks like one, try to infer emoji from tags/interests/name
  const looksLikeUrl = s.startsWith('http') || s.includes('://') || /\.(png|jpg|jpeg|gif|svg)$/i.test(s) || s.includes('.com');
  const tagsStr = ((profile?.shortTags || []).join(' ') + ' ' + ((profile?.interests || []).join(' ')) + ' ' + (name || '')).toLowerCase();

  const mapping: Record<string, string> = {
    creative: '🎨',
    friendly: '😊',
    shy: '🙈',
    ux: '🧑‍💻',
    coffee: '☕',
    data: '📊',
    engineer: '🛠️',
    design: '🎨',
    lily: '🌸',
    mika: '🧑‍💻',
    ari: '🤖',
  };

  for (const key of Object.keys(mapping)) {
    if (tagsStr.includes(key)) return mapping[key];
  }

  if (looksLikeUrl) {
    const fallback = ['🙂', '😄', '🐎', '☀️', '🌸', '🤖', '🧑‍💻', '🎨', '☕', '🚀'];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const nameStr = (name || s).toLowerCase();
  if (nameStr.includes('lily')) return '🌸';
  if (nameStr.includes('mika')) return '🧑‍💻';
  if (nameStr.includes('ari')) return '🤖';

  return '🙂';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId } = body || {};

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // If MODELSCOPE credentials are present, use generateText like the chat route does
    if (process.env.MODELSCOPE_API_KEY && process.env.MODELSCOPE_BASE_URL) {
      try {
        const modelScopeClient = createOpenAI({
          apiKey: process.env.MODELSCOPE_API_KEY,
          baseURL: process.env.MODELSCOPE_BASE_URL,
        });

        const modelName = process.env.MODELSCOPE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
        const model = modelScopeClient.chat(modelName);

        // Use generateText (same as chat route, but non-streaming)
        const { text } = await generateText({
          model,
          prompt: MODELSCOPE_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 800,
        });

        if (text) {
          console.log('MODELSCOPE response received, attempting to parse JSON');
          const parsed = await tryParseJSONFromText(text);
          if (parsed && Array.isArray(parsed.characters) && parsed.characters.length >= 2) {
            const characters: Character[] = parsed.characters.map((c: any, idx: number) => ({
              id: Number(c.id) || Number(Date.now().toString().slice(-6)) + idx,
              name: String(c.name || c.profile?.nickname || `User${idx + 1}`),
              avatar: pickEmoji(c.avatar, c.profile, String(c.name || c.profile?.nickname)),
              status: 'online',
              profile: {
                nickname: String(c.profile?.nickname || c.name || `User${idx + 1}`),
                gender: String(c.profile?.gender || 'unknown'),
                age: Number(c.profile?.age || 30),
                occupation: String(c.profile?.occupation || 'unknown'),
                location: String(c.profile?.location || 'unknown'),
                difficulty: (c.profile?.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                interests: Array.isArray(c.profile?.interests) ? c.profile.interests.slice(0, 6) : [],
                personality: String(c.profile?.personality || ''),
                shortTags: Array.isArray(c.profile?.shortTags) ? c.profile.shortTags.slice(0, 4) : [],
              },
              systemPrompt: String(c.systemPrompt || ''),
              starterMessage: String(c.starterMessage || ''),
            }));

            // Randomly pick one of the two characters to be the matched opponent
            const pickIndex = Math.random() < 0.5 ? 0 : 1;
            const matchedOpponent = characters[pickIndex];
            const secondCandidate = characters[1 - pickIndex];

            console.log('Successfully generated characters from MODELSCOPE');
            return NextResponse.json({ matchedOpponent, starterMessage: matchedOpponent.starterMessage, secondCandidate });
          } else {
            console.warn('MODELSCOPE response does not contain valid character data. Raw text:', text?.substring(0, 200));
          }
        }

        console.warn('MODELSCOPE returned empty response, falling back to deterministic mock');
      } catch (err) {
        console.error('MODELSCOPE call failed:', err);
        console.warn('Falling back to deterministic mock');
      }
    }

    // Fallback deterministic mock (always return HTTP 200 with JSON)
    console.log('Using deterministic mock for character generation');
    const chars = DETERMINISTIC_MOCK.characters as Character[];
    const matchedOpponent = chars[0];
    const secondCandidate = chars[1];

    return NextResponse.json({ matchedOpponent, starterMessage: matchedOpponent.starterMessage, secondCandidate });
  } catch (error) {
    console.error('Error in /api/match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';

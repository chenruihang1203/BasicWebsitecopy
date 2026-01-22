/**
 * Character Matching Endpoint - Data-Driven Architecture
 * 
 * Generates one character per configured model in DEFAULT_MODELS.
 * Adding a model to aiProviders.ts automatically creates a character for it.
 * No conditional logic based on model names.
 */

import { NextResponse } from 'next/server';
import { createProviders, UNIFIED_CHARACTER_PROMPT } from '@/lib/aiProviders';

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
  modelId: string; // Full model ID string (e.g., 'Qwen/Qwen2.5-7B-Instruct')
  modelDisplayName?: string; // Optional human-friendly display name (e.g., 'Qwen')
};

type Character = {
  id: number;
  name: string;
  avatar: string;
  status: 'online';
  profile: UserProfile;
  systemPrompt: string;
  starterMessage: string;
  modelId: string; // Full model ID string
  modelDisplayName?: string; // Optional human-friendly name
};

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
        modelId: 'Qwen/Qwen2.5-7B-Instruct',
      },
      systemPrompt:
        'You are Mika, a Taipei-based UX Designer. Roleplay as Mika: be curious, give concise thoughtful replies, occasionally refer to design processes. Avoid revealing you are an AI. Keep replies short (1–3 sentences).',
      starterMessage: "Hi! I'm Mika — I love talking about product design and coffee. What are you working on these days?",
      modelId: 'Qwen/Qwen2.5-7B-Instruct',
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
        modelId: 'deepseek-ai/DeepSeek-R1-0528',
      },
      systemPrompt:
        'You are Ari, a data engineer. Roleplay as Ari: be precise, concise, and technically coherent. Provide clear, factual replies. Avoid unnecessary small talk. Keep responses brief (1–2 sentences).',
      starterMessage: 'Hello. I focus on data pipelines and latency optimization. How can I help?',
      modelId: 'deepseek-ai/DeepSeek-R1-0528',
    },
  ],
};

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

    // Create providers for all configured models (data-driven)
    const providers = createProviders();

    if (providers.length === 0) {
      console.warn('[Match] No providers available, using deterministic mock');
      const chars = DETERMINISTIC_MOCK.characters as Character[];
      const pickIndex = Math.floor(Math.random() * chars.length);
      const matchedOpponent = chars[pickIndex];
      console.log(`[Match] Mock: returning ${chars.length} characters, selected: ${matchedOpponent.name}`);
      return NextResponse.json({ 
        matchedOpponent, 
        starterMessage: matchedOpponent.starterMessage,
        allCharacters: chars 
      });
    }

    try {
      console.log(`[Match] Generating characters from ${providers.length} models sequentially...`);
      
      const characters: Character[] = [];
      const REQUEST_DELAY_MS = 170000; // 请求间隔 170 秒

      // 串行生成角色，每次请求之间添加延迟
      for (let index = 0; index < providers.length; index++) {
        const provider = providers[index];
        
        try {
          const text = await provider.generate({
            system: 'You are a character generator. Output only valid JSON.',
            messages: [],
            prompt: UNIFIED_CHARACTER_PROMPT,
          });

          console.log(`[${provider.getDisplayName()}] Raw response length: ${text.length}`);
          const parsed = tryParseJSONFromText(text);
          
          if (parsed && parsed.character) {
            const c = parsed.character;
            const modelDisplayName = provider.getDisplayName();
            characters.push({
              id: Number(c.id) || Number(Date.now().toString().slice(-6)) + index,
              name: String(c.name || c.profile?.nickname || modelDisplayName),
              avatar: pickEmoji(c.avatar, c.profile, String(c.name || c.profile?.nickname)),
              status: 'online',
              profile: {
                nickname: String(c.profile?.nickname || c.name || modelDisplayName),
                gender: String(c.profile?.gender || 'unknown'),
                age: Number(c.profile?.age || 30),
                occupation: String(c.profile?.occupation || 'unknown'),
                location: String(c.profile?.location || 'unknown'),
                difficulty: (c.profile?.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                interests: Array.isArray(c.profile?.interests) ? c.profile.interests.slice(0, 6) : [],
                personality: String(c.profile?.personality || ''),
                shortTags: Array.isArray(c.profile?.shortTags) ? c.profile.shortTags.slice(0, 4) : [],
                modelId: provider.modelId,
                modelDisplayName: modelDisplayName,
              },
              systemPrompt: String(c.systemPrompt || ''),
              starterMessage: String(c.starterMessage || ''),
              modelId: provider.modelId,
              modelDisplayName: modelDisplayName,
            });
            console.log(`[${provider.getDisplayName()}] Character generated: ${characters[characters.length - 1].name}`);
          } else {
            console.warn(`[${provider.getDisplayName()}] Failed to parse character from response`);
            console.log(`[${provider.getDisplayName()}] Raw response snippet: ${text.substring(0, 1000)}...`);
          }
        } catch (error) {
          console.error(`[${provider.getDisplayName()}] Generation failed:`, error);
        }

        // 添加请求间隔（最后一个请求后不需要延迟）
        if (index < providers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        }
      }
      
      console.log(`[Match] Total characters successfully generated: ${characters.length}`);

      // Return all generated characters (one per model in DEFAULT_MODELS)
      if (characters.length > 0) {
        // Randomly select one as the matched opponent
        const pickIndex = Math.floor(Math.random() * characters.length);
        const matchedOpponent = characters[pickIndex];

        console.log(`[Match] Generated ${characters.length} characters, selected: ${matchedOpponent.name} (${matchedOpponent.modelId})`);
        
        // Return all characters plus the randomly selected matchedOpponent
        return NextResponse.json({ 
          matchedOpponent, 
          starterMessage: matchedOpponent.starterMessage,
          allCharacters: characters // Include all generated characters
        });
      } else {
        console.warn('[Match] No characters generated, falling back to deterministic mock');
      }
    } catch (err) {
      console.error('[Match] Character generation failed:', err);
    }

    // Fallback deterministic mock
    console.log('[Match] Using deterministic mock for character generation');
    const chars = DETERMINISTIC_MOCK.characters as Character[];
    // Ensure mock characters include modelDisplayName for UI
    const mappedChars = chars.map((c) => ({
      ...c,
      modelDisplayName:
        c.profile?.modelId === 'Qwen/Qwen2.5-7B-Instruct'
          ? 'Qwen'
          : c.profile?.modelId === 'deepseek-ai/DeepSeek-R1-0528'
          ? 'DeepSeek'
          : c.profile?.modelId || c.modelId,
      profile: {
        ...(c.profile || {}),
        modelDisplayName:
          c.profile?.modelId === 'Qwen/Qwen2.5-7B-Instruct'
            ? 'Qwen'
            : c.profile?.modelId === 'deepseek-ai/DeepSeek-R1-0528'
            ? 'DeepSeek'
            : c.profile?.modelId || c.modelId,
      },
    }));

    const pickIndex = Math.floor(Math.random() * mappedChars.length);
    const matchedOpponent = mappedChars[pickIndex];

    return NextResponse.json({ 
      matchedOpponent, 
      starterMessage: matchedOpponent.starterMessage,
      allCharacters: mappedChars // Return all mock characters
    });
  } catch (error) {
    console.error('[Match] Error in /api/match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function tryParseJSONFromText(text: string): any | null {
  if (!text) return null;
  
  // First, try to parse the entire text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from the text
  }

  // Try to find JSON markers (e.g., ```json ... ```)
  const markerRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
  const markerMatch = text.match(markerRegex);
  if (markerMatch) {
    try {
      return JSON.parse(markerMatch[1]);
    } catch (e) {
      // Continue to next method
    }
  }

  // Try to find the first balanced JSON object
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let endBrace = -1;
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endBrace = i;
          break;
        }
      }
    }
    if (endBrace !== -1) {
      const jsonCandidate = text.slice(firstBrace, endBrace + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (e) {
        // Try replacing single quotes with double quotes
        try {
          const fixedJson = jsonCandidate.replace(/'/g, '"');
          return JSON.parse(fixedJson);
        } catch (e2) {
          // Continue
        }
      }
    }
  }

  // Last resort: try the original method (first { to last })
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch (e2) {
      return null;
    }
  }

  return null;
}

export const runtime = 'edge';

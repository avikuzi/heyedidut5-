import {
  completeCommitteeChat,
  sanitizeGrounding,
  type AiIntent,
  type FetchLike
} from '../lib/ai/committeeChat.js';
import type { AiGroundingContext } from '../types/ai';

export type ServerEnv = Record<string, string | undefined>;

export type AiChatResponseBody = {
  reply?: string;
  usedIntents?: AiIntent[];
  error?: string;
  message?: string;
};

export type AiChatResult = {
  status: number;
  body: AiChatResponseBody;
};

export class AiHttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type BuildGrounding = (options: {
  jwt: string;
  periodLabel?: string;
  env: ServerEnv;
}) => Promise<AiGroundingContext>;

const PERIOD = /^\d{4}-\d{2}$/;

export function readServerSupabase(env: ServerEnv): { url: string; anonKey: string } | null {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  if (/YOUR_|placeholder|example\.supabase/i.test(url) || /YOUR_|placeholder/i.test(anonKey)) {
    return null;
  }
  if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
  return { url, anonKey };
}

function bearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)/i.exec(authorization.trim());
  return match?.[1] || null;
}

function readMessage(body: unknown): { message?: string; periodLabel?: string; grounding?: unknown } {
  if (!body || typeof body !== 'object') return {};
  const row = body as Record<string, unknown>;
  return {
    message: typeof row.message === 'string' ? row.message : undefined,
    periodLabel: typeof row.periodLabel === 'string' ? row.periodLabel : undefined,
    grounding: row.grounding
  };
}

export async function handleAiChat(
  input: {
    method?: string;
    authorization?: string;
    body?: unknown;
    env: ServerEnv;
  },
  deps?: {
    buildGrounding?: BuildGrounding;
    fetchImpl?: FetchLike;
  }
): Promise<AiChatResult> {
  if ((input.method || 'GET').toUpperCase() !== 'POST') {
    return { status: 405, body: { error: 'method_not_allowed', message: 'יש לשלוח POST.' } };
  }

  let body = input.body;
  if (typeof body === 'string') {
    try {
      body = body ? JSON.parse(body) : {};
    } catch {
      return { status: 400, body: { error: 'bad_json', message: 'גוף הבקשה אינו JSON תקין.' } };
    }
  }

  const parsed = readMessage(body);
  const message = (parsed.message || '').trim();
  if (!message) {
    return { status: 400, body: { error: 'missing_message', message: 'חסרה שאלת הוועד.' } };
  }
  if (message.length > 2000) {
    return { status: 400, body: { error: 'message_too_long', message: 'השאלה ארוכה מדי.' } };
  }

  const periodLabel = parsed.periodLabel && PERIOD.test(parsed.periodLabel) ? parsed.periodLabel : undefined;
  const supabase = readServerSupabase(input.env);
  let grounding: AiGroundingContext | null = null;

  try {
    if (supabase) {
      const jwt = bearerToken(input.authorization);
      if (!jwt) {
        return {
          status: 401,
          body: { error: 'unauthorized', message: 'נדרשת כניסת ועד הבית.' }
        };
      }
      const build = deps?.buildGrounding;
      if (!build) {
        const { buildGroundingFromSession } = await import('./supabaseGrounding.js');
        grounding = await buildGroundingFromSession({ jwt, periodLabel, env: input.env });
      } else {
        grounding = await build({ jwt, periodLabel, env: input.env });
      }
    } else {
      grounding = sanitizeGrounding(parsed.grounding);
      if (!grounding) {
        return {
          status: 400,
          body: {
            error: 'missing_grounding',
            message: 'במצב מקומי חסר הקשר קופה. חברו Supabase כדי לבנות אותו בשרת.'
          }
        };
      }
    }
  } catch (error) {
    if (error instanceof AiHttpError) {
      return { status: error.status, body: { error: error.code, message: error.message } };
    }
    console.error('AI grounding failed');
    return {
      status: 502,
      body: { error: 'grounding_failed', message: 'לא הצלחתי לטעון את נתוני הקופה.' }
    };
  }

  const dryRun = input.env.AI_DRY_RUN === '1';
  const apiKey = (input.env.OPENAI_API_KEY || input.env.AI_API_KEY || '').trim();
  if (!dryRun && !apiKey) {
    return {
      status: 503,
      body: {
        error: 'missing_ai_key',
        message: 'חסר מפתח AI בשרת (OPENAI_API_KEY או AI_API_KEY).'
      }
    };
  }

  try {
    const result = await completeCommitteeChat({
      message,
      grounding,
      apiKey: apiKey || undefined,
      baseUrl: input.env.OPENAI_BASE_URL,
      model: input.env.OPENAI_MODEL,
      dryRun,
      fetchImpl: deps?.fetchImpl
    });
    return { status: 200, body: { reply: result.reply, usedIntents: result.usedIntents } };
  } catch (error) {
    const code = error instanceof Error ? error.message : 'llm_failed';
    console.error('AI completion failed', code);
    if (code === 'missing_ai_key') {
      return {
        status: 503,
        body: { error: 'missing_ai_key', message: 'חסר מפתח AI בשרת (OPENAI_API_KEY או AI_API_KEY).' }
      };
    }
    return {
      status: 502,
      body: { error: 'llm_failed', message: 'העוזר לא הצליח להשיב כרגע. נסו שוב.' }
    };
  }
}

// Vercel runs this file as Node ESM (`"type": "module"`). Relative imports
// must include the .js extension that the compiler emits, or the function
// crashes on load with ERR_MODULE_NOT_FOUND.
import { handleAiChat } from '../../src/server/aiChatHandler.js';

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};

function headerValue(headers: ApiRequest['headers'], name: string): string | undefined {
  if (!headers) return undefined;
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0];
  return direct;
}

/** Vercel serverless: POST /api/ai/chat */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const result = await handleAiChat({
      method: req.method,
      authorization: headerValue(req.headers, 'authorization'),
      body: req.body,
      env: process.env
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('AI chat handler failed', error instanceof Error ? error.message : 'error');
    res.status(500).json({ error: 'server_error', message: 'שגיאה בשרת.' });
  }
}

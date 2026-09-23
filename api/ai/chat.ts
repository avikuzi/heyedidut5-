import { handleAiChat } from '../../src/server/aiChatHandler';

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
  const result = await handleAiChat({
    method: req.method,
    authorization: headerValue(req.headers, 'authorization'),
    body: req.body,
    env: process.env
  });
  res.status(result.status).json(result.body);
}

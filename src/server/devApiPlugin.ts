import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { handleAiChat } from './aiChatHandler.js';

function readBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > 256_000) {
        reject(new Error('body_too_large'));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Serves POST /api/ai/chat during `npm run dev` (same handler as Vercel). */
export function aiChatDevPlugin(): Plugin {
  return {
    name: 'ai-chat-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (path !== '/api/ai/chat') {
          next();
          return;
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        void (async () => {
          const raw = req.method === 'POST' ? await readBody(req) : '';
          const env = {
            ...loadEnv(server.config.mode, server.config.root, ''),
            ...process.env
          };
          const result = await handleAiChat({
            method: req.method,
            authorization: req.headers.authorization,
            body: raw,
            env
          });
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(result.body));
        })().catch((error) => {
          console.error('AI dev API failed', error instanceof Error ? error.message : 'error');
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'server_error', message: 'שגיאה בשרת.' }));
        });
      });
    }
  };
}

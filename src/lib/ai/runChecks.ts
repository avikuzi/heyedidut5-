import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiGroundingContext } from '../../types/ai';
import { handleAiChat } from '../../server/aiChatHandler';
import {
  answerFromGrounding,
  apartmentsMentionedInReply,
  buildLlmMessages,
  completeCommitteeChat,
  judgeReply,
  sanitizeGrounding,
  textHasAmount
} from './committeeChat';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_MATCH } from './systemPrompt';

type EvalFile = {
  sharedGrounding: AiGroundingContext;
  cases: Array<{
    id: string;
    intent: string;
    mustPass: boolean;
    message: string;
    groundingOverride?: unknown;
    expectedFacts: Record<string, unknown>;
  }>;
};

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function runEvalCases(): Promise<number> {
  const filePath = resolve(process.cwd(), 'eval/eval-cases.json');
  const file = JSON.parse(readFileSync(filePath, 'utf8')) as EvalFile;
  let failed = 0;

  for (const testCase of file.cases) {
    const grounding = sanitizeGrounding(testCase.groundingOverride || file.sharedGrounding);
    if (!grounding) {
      console.error(`FAIL ${testCase.id}: grounding did not sanitize`);
      failed += 1;
      continue;
    }
    const { reply, usedIntents } = await completeCommitteeChat({
      message: testCase.message,
      grounding,
      dryRun: true
    });
    const judged = judgeReply(testCase.expectedFacts, reply, grounding);
    const intentOk = usedIntents[0] === testCase.intent;
    const pass = judged.pass && intentOk;
    if (!pass) {
      failed += 1;
      console.error(`FAIL ${testCase.id}`, {
        intentOk,
        reasons: judged.reasons,
        reply
      });
    } else {
      console.log(`PASS ${testCase.id}`);
    }
  }

  return failed;
}

function runPrivacyChecks(grounding: AiGroundingContext): void {
  const aboutOne = answerFromGrounding('כמה חייבת דירה 3?', grounding);
  assert(textHasAmount(aboutOne, 540), 'apt 3 amount');
  assert(aboutOne.includes('לוי'), 'apt 3 name');
  assert(!aboutOne.includes('מזרחי'), 'must not leak apt 5 name');
  assert(!textHasAmount(aboutOne, 120), 'must not leak apt 5 amount');

  const aboutSettled = answerFromGrounding('כמה דירה 1 חייבת?', grounding);
  assert(aboutSettled.includes('אין חוב'), 'settled apartment has no debt');
  assert(!aboutSettled.includes('לוי') && !aboutSettled.includes('מזרחי'), 'settled question stays on that apartment');
  assert(apartmentsMentionedInReply(aboutSettled).every((apartment) => apartment === '1'), 'only apt 1');

  const draft = answerFromGrounding('נסח הודעת חוב לדירה 3', grounding);
  assert(draft.includes('טיוטה'), 'draft label');
  assert(draft.includes('לא נשלחה'), 'explicitly not sent');
  assert(!draft.includes('מזרחי'), 'draft does not name another tenant');
}

async function runHandlerChecks(grounding: AiGroundingContext): Promise<void> {
  const evil = {
    ...grounding,
    tenants: [{ apartment: '99', displayName: 'זר', balance: -99999 }]
  };

  const missingKey = await handleAiChat({
    method: 'POST',
    body: { message: 'מי חייב עכשיו?', grounding },
    env: {}
  });
  assert(missingKey.status === 503, `expected 503 without key, got ${missingKey.status}`);

  const noGrounding = await handleAiChat({
    method: 'POST',
    body: { message: 'מי חייב?' },
    env: { AI_DRY_RUN: '1' }
  });
  assert(noGrounding.status === 400, 'local mode requires grounding');

  const dry = await handleAiChat({
    method: 'POST',
    body: { message: 'מי חייב עכשיו?', grounding },
    env: { AI_DRY_RUN: '1' }
  });
  assert(dry.status === 200, 'dry run should answer');
  assert(textHasAmount(dry.body.reply || '', 540), 'dry run uses grounding');
  assert(dry.body.usedIntents?.[0] === 'U1', 'intent U1');

  let builderCalled = false;
  const serverBuilt = await handleAiChat(
    {
      method: 'POST',
      authorization: 'Bearer session-token',
      body: { message: 'מי חייב עכשיו?', grounding: evil },
      env: {
        SUPABASE_URL: 'https://heyedidut5.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        AI_DRY_RUN: '1'
      }
    },
    {
      buildGrounding: async () => {
        builderCalled = true;
        return grounding;
      }
    }
  );
  assert(builderCalled, 'server must build grounding when supabase is configured');
  assert(serverBuilt.status === 200, 'server grounding path');
  assert(textHasAmount(serverBuilt.body.reply || '', 540), 'reply uses server grounding');
  assert(!textHasAmount(serverBuilt.body.reply || '', 99999), 'client grounding ignored');
  assert(!(serverBuilt.body.reply || '').includes('דירה 99'), 'invented apartment ignored');

  const unauthenticated = await handleAiChat({
    method: 'POST',
    body: { message: 'מי חייב?', grounding: evil },
    env: {
      SUPABASE_URL: 'https://heyedidut5.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      OPENAI_API_KEY: 'sk-test'
    }
  });
  assert(unauthenticated.status === 401, 'supabase mode requires a session');

  let fetchCalled = false;
  const liveShape = await completeCommitteeChat({
    message: 'מי חייב עכשיו?',
    grounding,
    apiKey: 'sk-test',
    dryRun: false,
    fetchImpl: async (url, init) => {
      fetchCalled = true;
      const body = JSON.parse(String(init?.body || '{}')) as {
        messages: Array<{ role: string; content: string }>;
      };
      assert(url.endsWith('/chat/completions'), 'openai url');
      assert(body.messages[0]?.role === 'system', 'system role');
      assert(body.messages[0].content.includes('הידידות 5'), 'system prompt');
      assert(body.messages[0].content.includes('U4'), 'intents in prompt');
      assert(body.messages.at(-1)?.content.includes('מי חייב עכשיו?'), 'user message');
      assert(body.messages.at(-1)?.content.includes('"apartment":"3"') || body.messages.at(-1)?.content.includes('"apartment": "3"'), 'context json');
      const header = init?.headers as Record<string, string>;
      assert(header.Authorization === 'Bearer sk-test', 'api key header');
      return new Response(
        JSON.stringify({ choices: [{ message: { content: 'תשובה מהמודל בלבד' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
  assert(fetchCalled, 'production path calls the model');
  assert(liveShape.reply === 'תשובה מהמודל בלבד', 'production reply comes from the model');

  const messages = buildLlmMessages(grounding, 'נסח הודעת חוב לדירה 3');
  assert(messages[0].content.includes(SYSTEM_PROMPT.slice(0, 40)), 'prompt embedded');
  assert(!messages.some((message) => message.content.includes('sk-')), 'no secrets in prompt');
}

function runPromptDocCheck(): void {
  const doc = readFileSync(resolve(process.cwd(), 'prompts/system-he.md'), 'utf8');
  for (const sentence of SYSTEM_PROMPT_MATCH) {
    const stripped = doc.replace(/\*\*/g, '');
    assert(stripped.includes(sentence), `system doc missing: ${sentence}`);
    assert(SYSTEM_PROMPT.includes(sentence), `system prompt missing: ${sentence}`);
  }
}

export async function runAiChecks(): Promise<number> {
  const file = JSON.parse(readFileSync(resolve(process.cwd(), 'eval/eval-cases.json'), 'utf8')) as EvalFile;
  const grounding = sanitizeGrounding(file.sharedGrounding);
  if (!grounding) {
    console.error('shared grounding failed to sanitize');
    return 1;
  }

  try {
    runPromptDocCheck();
    runPrivacyChecks(grounding);
    await runHandlerChecks(grounding);
    console.log('PASS handler, privacy, and live-request shape');
  } catch (error) {
    console.error('FAIL checks', error instanceof Error ? error.message : error);
    return 1;
  }

  const failedCases = await runEvalCases();
  if (failedCases > 0) {
    console.error(`${failedCases} eval case(s) failed`);
    return 1;
  }
  console.log('eval cases passed');
  return 0;
}

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AiGroundingContext } from '../../types/ai';
import type { PropertyResident } from '../../types';
import { AssistantMarkdown } from '../../components/admin/AssistantMarkdown';
import { markdownToPlainText } from '../assistantMarkdown';
import { buildAiGroundingContext } from '../mappers';
import { handleAiChat } from '../../server/aiChatHandler';
import {
  answerFromGrounding,
  apartmentsMentionedInReply,
  buildChatCompletionBody,
  buildLlmMessages,
  COMMITTEE_CHAT_MAX_TOKENS,
  completeCommitteeChat,
  judgeReply,
  reasoningEffortForModel,
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
  assert(draft.includes('מזומן'), 'draft uses payment method');
  assert(draft.includes('התכתבות הוואטסאפ'), 'draft uses balance note');
  assert(!draft.includes('050-'), 'draft has no phone');
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
        max_tokens?: number;
        reasoning_effort?: string;
        messages: Array<{ role: string; content: string }>;
      };
      assert(url.endsWith('/chat/completions'), 'openai url');
      assert(body.max_tokens === COMMITTEE_CHAT_MAX_TOKENS, 'token cap leaves room for a full reply');
      assert(body.reasoning_effort === undefined, 'classic chat models omit reasoning_effort');
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

async function runCompletionLimitChecks(grounding: AiGroundingContext): Promise<void> {
  const openaiBase = 'https://api.openai.com/v1';
  const geminiBase = 'https://generativelanguage.googleapis.com/v1beta/openai';
  assert(COMMITTEE_CHAT_MAX_TOKENS >= 4000, 'token cap is a substantial raise');
  assert(reasoningEffortForModel('gemini-3.8-flash') === 'low', 'gemini model uses low reasoning effort');
  assert(reasoningEffortForModel('gpt-4o-mini') === undefined, 'gpt-4o-mini has no reasoning effort');
  assert(reasoningEffortForModel('gpt-4o-mini', openaiBase) === undefined, 'openai base keeps reasoning_effort off');
  assert(reasoningEffortForModel('gpt-4.1', openaiBase) === undefined, 'gpt-4.1 has no reasoning effort');
  assert(reasoningEffortForModel('gpt-4o-mini', geminiBase) === 'low', 'gemini base url opts in');

  const geminiBody = buildChatCompletionBody('gemini-3.8-flash', [{ role: 'user', content: 'מה היתרה?' }], geminiBase);
  assert(geminiBody.max_tokens === COMMITTEE_CHAT_MAX_TOKENS, 'gemini cap');
  assert(geminiBody.reasoning_effort === 'low', 'gemini request sets reasoning_effort');
  assert(geminiBody.temperature === 0.2, 'temperature unchanged');
  const plainBody = buildChatCompletionBody('gpt-4o-mini', [{ role: 'user', content: 'מה היתרה?' }], openaiBase);
  assert(plainBody.max_tokens === COMMITTEE_CHAT_MAX_TOKENS, 'plain models still get the raised cap');
  assert(!('reasoning_effort' in plainBody), 'plain OpenAI body omits reasoning_effort');
  const geminiHostPlainModel = buildChatCompletionBody('gpt-4o-mini', [{ role: 'user', content: 'מה היתרה?' }], geminiBase);
  assert(geminiHostPlainModel.reasoning_effort === 'low', 'gemini host accepts reasoning_effort');

  await completeCommitteeChat({
    message: 'מה היתרה?',
    grounding,
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
    baseUrl: openaiBase,
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      assert(body.model === 'gpt-4o-mini', 'plain model name');
      assert(body.max_tokens === COMMITTEE_CHAT_MAX_TOKENS, 'plain model gets the raised cap');
      assert(!('reasoning_effort' in body), 'live openai request omits reasoning_effort');
      return new Response(
        JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: 'היתרה תקינה.' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };

  try {
    const partial = 'היתרה ירדה ל־**58';
    const truncated = await handleAiChat(
      {
        method: 'POST',
        body: { message: 'למה היתרה ירדה?', grounding },
        env: {
          AI_API_KEY: 'sk-test',
          OPENAI_MODEL: 'gemini-3.8-flash',
          OPENAI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai',
          AI_DRY_RUN: '0'
        }
      },
      {
        fetchImpl: async (url, init) => {
          assert(String(url).includes('/chat/completions'), 'completions url');
          const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
          assert(body.model === 'gemini-3.8-flash', 'gemini model');
          assert(body.max_tokens === COMMITTEE_CHAT_MAX_TOKENS, 'handler sends raised cap');
          assert(body.reasoning_effort === 'low', 'handler sends reasoning_effort');
          assert(!JSON.stringify(body).includes('sk-test'), 'request body has no api key');
          return new Response(
            JSON.stringify({
              choices: [{ finish_reason: 'length', message: { content: partial } }]
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    );
    assert(truncated.status === 200, 'partial reply is still returned');
    assert(truncated.body.reply === partial, 'truncated text is not rewritten');
    assert(
      warnings.some((line) => line.includes('finish_reason=length') && line.includes('model=gemini-3.8-flash')),
      'length limit logged'
    );
    assert(
      warnings.every((line) => !line.includes(partial) && !line.includes('sk-test') && !line.includes('למה היתרה')),
      'length log has no reply, question, or secret'
    );

    warnings.length = 0;
    let emptyFailed = false;
    try {
      await completeCommitteeChat({
        message: 'מה היתרה?',
        grounding,
        apiKey: 'sk-test',
        model: 'gemini-3.8-flash',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '' } }] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
      });
    } catch (error) {
      emptyFailed = error instanceof Error && error.message === 'llm_empty';
    }
    assert(emptyFailed, 'empty length-limited completion still fails');
    assert(
      warnings.some((line) => line.includes('finish_reason=length')),
      'empty truncation is logged before the error'
    );

    warnings.length = 0;
    const stopped = await completeCommitteeChat({
      message: 'מה היתרה?',
      grounding,
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: 'היתרה 900.67 ₪.' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    });
    assert(stopped.reply.includes('900.67'), 'complete reply returned');
    assert(warnings.length === 0, 'finish_reason stop is not logged as truncation');
  } finally {
    console.warn = originalWarn;
  }
}

function runGroundingFieldChecks(grounding: AiGroundingContext): void {
  const apt3 = grounding.tenants.find((tenant) => tenant.apartment === '3');
  assert(apt3?.paymentMethod === 'מזומן', 'sanitized paymentMethod');
  assert(apt3?.balanceNote?.includes('התכתבות הוואטסאפ'), 'sanitized balanceNote');

  const withSecrets = {
    ...grounding,
    tenants: grounding.tenants.map((tenant) =>
      tenant.apartment === '3'
        ? {
            ...tenant,
            phone: '050-1234567',
            email: 'secret@example.com',
            notes: 'private notes should not pass'
          }
        : tenant
    )
  };
  const cleaned = sanitizeGrounding(withSecrets);
  assert(cleaned, 'grounding with extra keys still sanitizes');
  const serialized = JSON.stringify(cleaned);
  assert(serialized.includes('מזומן'), 'payment method kept');
  assert(serialized.includes('התכתבות הוואטסאפ'), 'balance note kept');
  assert(!serialized.includes('050-1234567'), 'phone dropped');
  assert(!serialized.includes('secret@example.com'), 'email dropped');
  assert(!serialized.includes('private notes should not pass'), 'free-form notes dropped');

  const legacy = sanitizeGrounding({
    ...grounding,
    tenants: grounding.tenants.map((tenant) => {
      const { paymentMethod: _payment, balanceNote: _note, ...rest } = tenant;
      return { ...rest, paymentMethod: '', balanceNote: null };
    })
  });
  assert(legacy, 'missing payment fields still sanitize');
  assert(
    legacy?.tenants.every((tenant) => tenant.paymentMethod === undefined && tenant.balanceNote === undefined),
    'blank payment method and null note are omitted'
  );

  const mapped = buildAiGroundingContext(
    [
      {
        id: 'p3',
        propertyNumber: 3,
        residents: 'אמיר ומירי חנוכה',
        currentBalance: -540,
        paymentMethod: 'מזומן / אפליקציה לאבי',
        balanceNote: 'משלם במזומן. את התשלום האחרון אפשר לבדוק בהתכתבות הוואטסאפ.',
        phone: '050-9999999',
        email: 'apt3@example.com'
      } as PropertyResident,
      {
        id: 'p1',
        propertyNumber: 1,
        residents: 'כהן',
        currentBalance: 0,
        paymentMethod: '   ',
        balanceNote: ''
      } as PropertyResident
    ],
    [],
    '2026-09'
  );
  const mappedJson = JSON.stringify(mapped);
  const mappedApt3 = mapped.tenants.find((tenant) => tenant.apartment === '3');
  const mappedApt1 = mapped.tenants.find((tenant) => tenant.apartment === '1');
  assert(mappedApt3?.paymentMethod === 'מזומן / אפליקציה לאבי', 'client mapper payment method');
  assert(mappedApt3?.balanceNote?.includes('וואטסאפ'), 'client mapper balance note');
  assert(mappedApt1?.paymentMethod === undefined, 'blank payment method omitted');
  assert(mappedApt1?.balanceNote === undefined, 'blank balance note omitted');
  assert(!mappedJson.includes('050-9999999'), 'mapper does not copy phone');
  assert(!mappedJson.includes('apt3@example.com'), 'mapper does not copy email');

  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260926120000_ai_grounding_payment_note.sql'),
    'utf8'
  );
  assert(/create or replace function public\.build_ai_grounding/i.test(sql), 'migration replaces grounding function');
  assert(sql.includes('p.payment_method'), 'migration reads payment_method');
  assert(sql.includes('p.balance_note'), 'migration reads balance_note');
  assert(sql.includes("'paymentMethod'"), 'migration emits paymentMethod');
  assert(sql.includes("'balanceNote'"), 'migration emits balanceNote');
  assert(sql.includes('is_committee()'), 'committee gate stays');
  assert(!/p\.phone|p\.email/.test(sql), 'migration does not select phone or email');
}

function runMarkdownChecks(): void {
  const sample = [
    '**5,600 ₪** וגם *הערה*',
    '',
    '**הוצאות עיקריות:**',
    '- חשמל משותף',
    '* מעליות',
    '',
    '1. ניקיון 450 ₪',
    '2. ביטוח',
    '',
    '***',
    '---',
    '',
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">לחצו</a>'
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(AssistantMarkdown, { text: sample }));
  assert(html.includes('dir="rtl"'), 'assistant markdown stays rtl');
  assert(html.includes('<strong'), 'bold renders as an element');
  assert(html.includes('5,600 ₪'), 'shekel amount stays intact');
  assert(html.includes('<em'), 'italic renders as an element');
  assert(html.includes('<ul'), 'bullets render as a list');
  assert(html.includes('<ol'), 'numbers render as a list');
  assert(html.includes('<hr'), 'horizontal rule renders');
  assert(!html.includes('**'), 'bold markers are not shown');
  assert(!html.includes('<script'), 'script tag is not raw HTML');
  assert(!html.includes('<img'), 'img tag is not raw HTML');
  assert(!html.includes('<a '), 'anchor tag is not raw HTML');
  assert(html.includes('&lt;script&gt;'), 'script text is escaped');
  assert(html.includes('&lt;img'), 'img text is escaped');
  assert(html.includes('text-right'), 'lists stay right aligned');

  const plain = markdownToPlainText(sample);
  assert(plain.includes('5,600 ₪'), 'copy keeps the amount');
  assert(plain.includes('הוצאות עיקריות:'), 'copy keeps bold text');
  assert(plain.includes('• חשמל משותף'), 'copy keeps bullet text');
  assert(plain.includes('• מעליות'), 'copy keeps star-list text');
  assert(plain.includes('1. ניקיון 450 ₪'), 'copy keeps numbered text');
  assert(!plain.includes('**'), 'copy drops bold markers');
  assert(!plain.includes('***'), 'copy drops thematic break');
  assert(!/^---$/m.test(plain), 'copy drops rule lines');
  assert(!plain.includes('- חשמל'), 'copy drops markdown bullet markers');
  assert(plain.includes('<script>alert(1)</script>'), 'copy stays plain text, not HTML');

  const source = readFileSync(resolve(process.cwd(), 'src/components/admin/AssistantMarkdown.tsx'), 'utf8');
  assert(!source.includes('dangerouslySetInnerHTML'), 'renderer does not use dangerouslySetInnerHTML');
  const chat = readFileSync(resolve(process.cwd(), 'src/components/admin/CommitteeAiChat.tsx'), 'utf8');
  assert(chat.includes('markdownToPlainText'), 'draft copy strips markdown');
  assert(!chat.includes('dangerouslySetInnerHTML'), 'chat does not inject HTML');
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
    runGroundingFieldChecks(grounding);
    runMarkdownChecks();
    runPrivacyChecks(grounding);
    await runHandlerChecks(grounding);
    await runCompletionLimitChecks(grounding);
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

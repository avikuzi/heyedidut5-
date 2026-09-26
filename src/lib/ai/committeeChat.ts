import type { AiGroundingContext } from '../../types/ai';
import { FEW_SHOTS_APPENDIX, SYSTEM_PROMPT } from './systemPrompt.js';

export type AiIntent = 'U1' | 'U2' | 'U3' | 'U4' | 'OUT';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר'
];

const OUT_REDIRECT =
  'אני מכסה כרגע: מי חייב, הסבר לשינוי ביתרת הקופה, חריגות בהוצאות, וניסוח הודעת חוב לדירה. אפשר לנסח מחדש באחד מאלה?';

type Tenant = AiGroundingContext['tenants'][number];
type LedgerRow = AiGroundingContext['ledger'][number];

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function formatNis(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    maximumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2
  });
  return `${formatted} ₪`;
}

export function classifyIntent(message: string): AiIntent {
  const text = message.trim();
  const wantsDraft = /נסח|תנסח|טיוט|הודעת חוב|ניסוח הודעה/.test(text);
  const wantsSend =
    /תשלח|לשלוח|שלחו|שליחה|וואטסאפ|ווטסאפ|whatsapp|מייל|אימייל|e-?mail/i.test(text) ||
    /(?:^|\s)שלח(?:\s|$)/.test(text);
  if (wantsSend && !wantsDraft) return 'OUT';
  if (wantsDraft) return 'U4';
  if (/חריג/.test(text)) return 'U3';
  if (/יתרה|ירד|ירידה|קופה/.test(text)) return 'U2';
  if (/חייב|חוב/.test(text)) return 'U1';
  return 'OUT';
}

export function mentionedApartments(message: string): string[] {
  const found: string[] = [];
  const re = /דירה(?:\s*מס(?:פר|')?)?\s*([0-9]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(message))) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

function shortDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])}/${Number(match[2])}`;
}

function periodPhrase(label?: string): string {
  if (!label) return '';
  const match = /^(\d{4})-(\d{2})$/.exec(label);
  if (!match) return label;
  const name = MONTHS_HE[Number(match[2]) - 1];
  return name ? `${name} ${match[1]} (${label})` : label;
}

function debtorsOf(tenants: Tenant[]): Tenant[] {
  return tenants.filter((tenant) => tenant.balance < 0);
}

function answerU1(message: string, grounding: AiGroundingContext): string {
  if (grounding.tenants.length === 0) {
    return 'חסרים נתוני דיירים ב-CONTEXT, ולכן אי אפשר לקבוע מי חייב. לא ממציא דירות או סכומים.';
  }

  const asked = mentionedApartments(message);
  if (asked.length === 1) {
    const tenant = grounding.tenants.find((item) => item.apartment === asked[0]);
    if (!tenant) {
      return `דירה ${asked[0]} לא מופיעה ב-CONTEXT. חסר מידע על הדירה — לא ממציא סכום.`;
    }
    if (tenant.balance < 0) {
      const name = tenant.displayName ? ` (${tenant.displayName})` : '';
      return `דירה ${tenant.apartment}${name} חייבת ${formatNis(tenant.balance)}.`;
    }
    return `לדירה ${tenant.apartment} אין חוב פתוח.`;
  }

  const debtors = debtorsOf(grounding.tenants);
  if (debtors.length === 0) {
    return 'אין חובות פתוחים — כל הדירות ב-CONTEXT מוסדרות (יתרה 0 או חיובית).';
  }

  const total = debtors.reduce((sum, tenant) => sum + Math.abs(tenant.balance), 0);
  const countLabel =
    debtors.length === 1 ? 'דירה אחת' : debtors.length === 2 ? 'שתי דירות' : `${debtors.length} דירות`;
  const lines = [`יש ${countLabel} עם חוב פתוח:`, ''];
  for (const tenant of debtors) {
    const name = tenant.displayName ? ` (${tenant.displayName})` : '';
    lines.push(`- דירה ${tenant.apartment}${name}: ${formatNis(tenant.balance)}`);
  }
  lines.push('', `סה״כ חובות: ${formatNis(total)}.`);
  const largest = [...debtors].sort((a, b) => a.balance - b.balance)[0];
  if (largest) {
    lines.push('', `רוצה שנסח הודעת תזכורת לדירה ${largest.apartment}?`);
  }
  return lines.join('\n');
}

function answerU2(grounding: AiGroundingContext): string {
  const { fund, ledger } = grounding;
  const period = fund.periodLabel;
  const inPeriod = period ? ledger.filter((row) => row.date.startsWith(period)) : ledger;
  const rows = inPeriod.length > 0 ? inPeriod : ledger;
  const expenses = rows
    .filter((row) => row.type === 'expense')
    .sort((a, b) => b.amount - a.amount);
  const incomes = rows.filter((row) => row.type === 'income');
  const incomeSum = incomes.reduce((sum, row) => sum + row.amount, 0);
  const lines: string[] = [];

  if (fund.previousBalance == null) {
    lines.push(
      `חסר previousBalance ב-CONTEXT, ולכן אי אפשר לחשב את גודל השינוי. היתרה כעת ${formatNis(fund.balance)}.`
    );
  } else {
    const drop = fund.previousBalance - fund.balance;
    const when = periodPhrase(period) || grounding.asOf;
    if (drop > 0) {
      lines.push(
        `ב${when} היתרה ירדה מ־${formatNis(fund.previousBalance)} ל־${formatNis(fund.balance)} (ירידה של ${formatNis(drop)}).`
      );
    } else if (drop < 0) {
      lines.push(
        `ב${when} היתרה עלתה מ־${formatNis(fund.previousBalance)} ל־${formatNis(fund.balance)} (עלייה של ${formatNis(Math.abs(drop))}).`
      );
    } else {
      lines.push(`ב${when} היתרה נשארה ${formatNis(fund.balance)}.`);
    }
  }

  const top = expenses.slice(0, 3);
  if (top.length === 0) {
    lines.push('חסרות תנועות ledger להסבר השינוי.');
  } else {
    lines.push('', 'התנועות העיקריות ב-ledger:');
    top.forEach((row, index) => {
      const note = row.note ? ` (${row.note})` : '';
      lines.push(
        `${index + 1}. הוצאה ${formatNis(row.amount)} — ${row.category}${note} (${shortDate(row.date)})`
      );
    });
  }

  if (incomes.length > 0) {
    const apartments = incomes
      .map((row) => row.apartment)
      .filter((apartment): apartment is string => Boolean(apartment));
    const aptLabel = apartments.length > 0 ? ` (דירות ${apartments.join(' ו־')})` : '';
    lines.push('', `מול זה נכנסו ${formatNis(incomeSum)} מגבייה${aptLabel}.`);
  }

  if (top.length >= 2) {
    lines.push('', 'השינוי מוסבר בעיקר מההוצאות הגדולות ב-ledger, ומול גבייה אם נרשמה.');
  }
  return lines.join('\n');
}

function answerU3(grounding: AiGroundingContext): string {
  const expenses = grounding.ledger.filter((row) => row.type === 'expense');
  if (expenses.length === 0) {
    return 'חסרות הוצאות ב-ledger, ולכן אי אפשר לסמן חריגות.';
  }

  const hints = grounding.anomalyHints;
  const threshold = hints?.expenseThresholdAbs;
  const multiplier = hints?.expenseVsAvgMultiplier;
  const avg = expenses.reduce((sum, row) => sum + row.amount, 0) / expenses.length;

  if (threshold == null && multiplier == null) {
    const top = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);
    const lines = ['אין כלל חריגות מוגדר ב-CONTEXT. ההוצאות הגדולות ביותר:'];
    top.forEach((row, index) => {
      lines.push(`${index + 1}. ${formatNis(row.amount)} — ${row.category}`);
    });
    return lines.join('\n');
  }

  const flagged = expenses
    .filter((row) => {
      if (threshold != null && row.amount >= threshold) return true;
      if (multiplier != null && avg > 0 && row.amount >= avg * multiplier) return true;
      return false;
    })
    .sort((a, b) => b.amount - a.amount);

  if (flagged.length === 0) {
    const thresholdLabel = threshold != null ? formatNis(threshold) : 'שב-CONTEXT';
    return `לפי הסף ${thresholdLabel}, אין הוצאות חריגות.`;
  }

  const countLabel = flagged.length === 2 ? 'שתי הוצאות חריגות' : 'הוצאות חריגות';
  const thresholdLabel = threshold != null ? formatNis(threshold) : 'שב-CONTEXT';
  const lines = [`לפי הסף ${thresholdLabel}, יש ${countLabel}:`, ''];
  flagged.forEach((row, index) => {
    const note = row.note ? ` / ${row.note}` : '';
    lines.push(`${index + 1}. ${formatNis(row.amount)} — ${row.category}${note} (${shortDate(row.date)})`);
  });

  const below = expenses
    .filter((row) => !flagged.some((flag) => flag.id === row.id))
    .sort((a, b) => b.amount - a.amount);
  if (below[0]) {
    lines.push(
      '',
      `${below[0].category} (${formatNis(below[0].amount)}) מתחת לסף ולא מסומן כחריג.`
    );
  }
  return lines.join('\n');
}

function draftForTenant(tenant: Tenant, grounding: AiGroundingContext): string {
  const greeting = tenant.displayName
    ? `שלום ${tenant.displayName} (דירה ${tenant.apartment}),`
    : `שלום (דירה ${tenant.apartment}),`;
  const lines = [
    'טיוטה להעתקה (לא נשלחה):',
    '',
    '---',
    greeting,
    '',
    `לפי רישומי ועד הבית בבניין ${grounding.building.name}, יתרת הדירה שלכם עומדת על חוב של ${formatNis(tenant.balance)}.`
  ];
  if (tenant.paymentMethod) {
    lines.push('', `אמצעי התשלום הרשום לדירה: ${tenant.paymentMethod}.`);
  }
  if (tenant.balanceNote) {
    lines.push('', tenant.balanceNote);
  }
  lines.push(
    '',
    'נשמח אם תוכלו להסדיר את התשלום בהקדם. לשאלות אפשר לפנות לוועד הבית.',
    '',
    'בברכה,',
    `ועד הבית — ${grounding.building.name}`,
    '---',
    '',
    'זו טיוטה בלבד לוועד להעתיק. לא נשלחה לדייר.'
  );
  return lines.join('\n');
}

function answerU4(message: string, grounding: AiGroundingContext): string {
  if (grounding.tenants.length === 0) {
    return 'חסרים נתוני דיירים ב-CONTEXT, ולכן אי אפשר לנסח הודעת חוב. לא ממציא דירה או סכום.';
  }

  const asked = mentionedApartments(message);
  if (asked.length === 0) {
    const debtors = debtorsOf(grounding.tenants);
    if (debtors.length === 0) {
      return 'אין חובות פתוחים, ולכן אין למי לנסח הודעת חוב. לא נשלח דבר.';
    }
    const list = debtors
      .map((tenant) => `דירה ${tenant.apartment} חייבת ${formatNis(tenant.balance)}`)
      .join('\n');
    return `לאיזו דירה לנסח טיוטה? לא נשלח דבר.\n${list}`;
  }

  const blocks = asked.map((apartment) => {
    const tenant = grounding.tenants.find((item) => item.apartment === apartment);
    if (!tenant) {
      return `דירה ${apartment} לא מופיעה ב-CONTEXT. חסר מידע — לא ניסחתי הודעה ולא המצאתי סכום.`;
    }
    if (tenant.balance >= 0) {
      return `לדירה ${apartment} אין חוב פתוח, ולכן לא ניסחתי הודעת חוב.`;
    }
    return draftForTenant(tenant, grounding);
  });
  return blocks.join('\n\n');
}

function answerOut(message: string): string {
  const wantsSend =
    /תשלח|לשלוח|שלחו|שליחה|וואטסאפ|ווטסאפ|whatsapp|מייל|אימייל|e-?mail/i.test(message) ||
    /(?:^|\s)שלח(?:\s|$)/.test(message);
  if (wantsSend) {
    return `אני לא שולח הודעות, מיילים או WhatsApp.\n\n${OUT_REDIRECT}`;
  }
  return OUT_REDIRECT;
}

/** Deterministic grounded reply. Used by offline eval and AI_DRY_RUN only. */
export function answerFromGrounding(message: string, grounding: AiGroundingContext): string {
  const intent = classifyIntent(message);
  if (intent === 'U1') return answerU1(message, grounding);
  if (intent === 'U2') return answerU2(grounding);
  if (intent === 'U3') return answerU3(grounding);
  if (intent === 'U4') return answerU4(message, grounding);
  return answerOut(message);
}

function ledgerRow(item: unknown): LedgerRow | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const amount = asNumber(row.amount);
  const date = typeof row.date === 'string' ? row.date : '';
  const category = typeof row.category === 'string' ? row.category : '';
  const id = row.id == null ? '' : String(row.id);
  if (!id || !date || !category || amount == null) return null;
  if (row.type !== 'income' && row.type !== 'expense') return null;
  const note = typeof row.note === 'string' && row.note ? row.note : undefined;
  const apartment =
    row.apartment == null || row.apartment === ''
      ? undefined
      : String(row.apartment);
  return {
    id,
    date,
    type: row.type,
    amount: Math.abs(amount),
    category,
    ...(note ? { note } : {}),
    ...(apartment ? { apartment } : {})
  };
}

/** Keep only contract fields so extra tenant PII cannot ride along into the prompt. */
export function sanitizeGrounding(input: unknown): AiGroundingContext | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const building = raw.building;
  const fund = raw.fund;
  if (!building || typeof building !== 'object' || !fund || typeof fund !== 'object') return null;
  const buildingRow = building as Record<string, unknown>;
  const fundRow = fund as Record<string, unknown>;
  if (typeof buildingRow.id !== 'string' || typeof buildingRow.name !== 'string') return null;
  if (fundRow.currency !== 'ILS') return null;
  const balance = asNumber(fundRow.balance);
  if (balance == null) return null;
  if (!Array.isArray(raw.tenants) || !Array.isArray(raw.ledger)) return null;

  const tenants: Tenant[] = [];
  for (const item of raw.tenants) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const tenantBalance = asNumber(row.balance);
    const apartment = row.apartment == null ? '' : String(row.apartment).trim();
    if (!apartment || tenantBalance == null) return null;
    const displayName = typeof row.displayName === 'string' ? row.displayName : '';
    const lastPaymentAt =
      typeof row.lastPaymentAt === 'string' && row.lastPaymentAt ? row.lastPaymentAt : undefined;
    const paymentMethod =
      typeof row.paymentMethod === 'string' && row.paymentMethod.trim()
        ? row.paymentMethod.trim()
        : undefined;
    const balanceNote =
      typeof row.balanceNote === 'string' && row.balanceNote.trim()
        ? row.balanceNote.trim()
        : undefined;
    tenants.push({
      apartment,
      displayName,
      balance: tenantBalance,
      ...(lastPaymentAt ? { lastPaymentAt } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(balanceNote ? { balanceNote } : {})
    });
  }

  const ledger: LedgerRow[] = [];
  for (const item of raw.ledger.slice(0, 200)) {
    const row = ledgerRow(item);
    if (row) ledger.push(row);
  }

  const previousBalance = asNumber(fundRow.previousBalance);
  const periodLabel =
    typeof fundRow.periodLabel === 'string' && fundRow.periodLabel ? fundRow.periodLabel : undefined;
  const asOf = typeof raw.asOf === 'string' && raw.asOf ? raw.asOf : new Date().toISOString();

  let anomalyHints: AiGroundingContext['anomalyHints'];
  if (raw.anomalyHints && typeof raw.anomalyHints === 'object') {
    const hints = raw.anomalyHints as Record<string, unknown>;
    const expenseThresholdAbs = asNumber(hints.expenseThresholdAbs);
    const expenseVsAvgMultiplier = asNumber(hints.expenseVsAvgMultiplier);
    if (expenseThresholdAbs != null || expenseVsAvgMultiplier != null) {
      anomalyHints = {
        ...(expenseThresholdAbs != null ? { expenseThresholdAbs } : {}),
        ...(expenseVsAvgMultiplier != null ? { expenseVsAvgMultiplier } : {})
      };
    }
  }

  return {
    asOf,
    building: { id: buildingRow.id, name: buildingRow.name },
    fund: {
      balance,
      currency: 'ILS',
      ...(previousBalance != null ? { previousBalance } : {}),
      ...(periodLabel ? { periodLabel } : {})
    },
    tenants,
    ledger,
    ...(anomalyHints ? { anomalyHints } : {})
  };
}

export function formatUserTurn(grounding: AiGroundingContext, message: string): string {
  return [
    'CONTEXT:',
    JSON.stringify(grounding),
    '',
    'שאלת הוועד:',
    message.trim(),
    '',
    'ענה רק על שאלת הוועד, עם CONTEXT כמקור יחיד. אל תשתמש במספרים מהדוגמאות אם הם לא ב-CONTEXT.'
  ].join('\n');
}

export function buildLlmMessages(grounding: AiGroundingContext, message: string): ChatMessage[] {
  return [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${FEW_SHOTS_APPENDIX}` },
    { role: 'user', content: formatUserTurn(grounding, message) }
  ];
}

/**
 * Gemini's OpenAI-compatible endpoint bills thought tokens against max_tokens
 * (native max_output_tokens). gemini-3.8-flash thinks at medium by default, so
 * the old 900 cap stopped visible U2/U3 answers mid-number. 8192 is a ceiling
 * (above a ~4000 floor), not a target: low thinking plus a full committee
 * reply fit, and the model still stops when the answer is done.
 */
export const COMMITTEE_CHAT_MAX_TOKENS = 8192;

const GEMINI_OPENAI_HOST = 'generativelanguage.googleapis.com';

/**
 * Smallest thinking level gemini-3.8-flash actually honors (low | medium | high).
 * Thinking cannot be turned off on Gemini 3. Plain OpenAI chat models reject
 * reasoning_effort, so it is sent only when the model or base URL is Gemini.
 */
export function reasoningEffortForModel(model: string, baseUrl?: string): 'low' | undefined {
  if (model.toLowerCase().includes('gemini')) return 'low';
  const base = (baseUrl || '').trim();
  if (!base) return undefined;
  try {
    const host = new URL(base).hostname.toLowerCase();
    if (host === GEMINI_OPENAI_HOST || host.endsWith(`.${GEMINI_OPENAI_HOST}`)) return 'low';
  } catch {
    if (base.toLowerCase().includes(GEMINI_OPENAI_HOST)) return 'low';
  }
  return undefined;
}

export function buildChatCompletionBody(
  model: string,
  messages: ChatMessage[],
  baseUrl?: string
): Record<string, unknown> {
  const reasoningEffort = reasoningEffortForModel(model, baseUrl);
  return {
    model,
    temperature: 0.2,
    max_tokens: COMMITTEE_CHAT_MAX_TOKENS,
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    messages
  };
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function completeCommitteeChat(options: {
  message: string;
  grounding: AiGroundingContext;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  dryRun?: boolean;
  fetchImpl?: FetchLike;
}): Promise<{ reply: string; usedIntents: AiIntent[] }> {
  const usedIntents = [classifyIntent(options.message)];
  if (options.dryRun || !options.apiKey) {
    if (!options.dryRun) {
      throw new Error('missing_ai_key');
    }
    return { reply: answerFromGrounding(options.message, options.grounding), usedIntents };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const base = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = options.model || 'gpt-4o-mini';
  const response = await fetchImpl(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      buildChatCompletionBody(model, buildLlmMessages(options.grounding, options.message), base)
    ),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    throw new Error(`llm_http_${response.status}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>;
  };
  const choice = payload.choices?.[0];
  if (choice?.finish_reason === 'length') {
    console.warn(`AI chat truncated finish_reason=length model=${model}`);
  }
  const reply = choice?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('llm_empty');
  }
  return { reply: reply.trim(), usedIntents };
}

export function textHasAmount(text: string, amount: number): boolean {
  const abs = Math.abs(amount);
  const compact = text.replace(/[,\s\u00A0\u202F]/g, '');
  if (compact.includes(String(abs))) return true;
  return text.includes(abs.toLocaleString('en-US'));
}

export function claimsMessageSent(text: string): boolean {
  const cleaned = text
    .replace(/לא\s*נשלחה/g, '')
    .replace(/לא\s*נשלח/g, '')
    .replace(/אינה\s*נשלחת/g, '')
    .replace(/לא\s*שולח/g, '');
  return ['שלחתי', 'נשלח', 'WhatsApp נשלח', 'נשלחה ההודעה'].some((phrase) => cleaned.includes(phrase));
}

export function apartmentsMentionedInReply(text: string): string[] {
  return mentionedApartments(text);
}

export type EvalExpected = Record<string, unknown>;

export function judgeReply(
  expected: EvalExpected,
  reply: string,
  grounding: AiGroundingContext
): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const fail = (reason: string) => reasons.push(reason);

  if (expected.mustNotInventApartments === true || expected.mustNotInventDebtors === true) {
    const known = new Set(grounding.tenants.map((tenant) => tenant.apartment));
    for (const apartment of apartmentsMentionedInReply(reply)) {
      if (!known.has(apartment)) fail(`invented apartment ${apartment}`);
    }
  }

  const debtorApartments = expected.debtorApartments;
  if (Array.isArray(debtorApartments)) {
    for (const apartment of debtorApartments) {
      if (!reply.includes(`דירה ${apartment}`)) fail(`missing apartment ${apartment}`);
    }
  }

  const debtAmounts = expected.debtAmountsAbs;
  if (debtAmounts && typeof debtAmounts === 'object') {
    for (const amount of Object.values(debtAmounts as Record<string, number>)) {
      if (!textHasAmount(reply, amount)) fail(`missing debt amount ${amount}`);
    }
  }

  if (typeof expected.totalDebtAbs === 'number' && !textHasAmount(reply, expected.totalDebtAbs)) {
    fail(`missing total ${expected.totalDebtAbs}`);
  }
  if (typeof expected.previousBalance === 'number' && !textHasAmount(reply, expected.previousBalance)) {
    fail('missing previous balance');
  }
  if (typeof expected.currentBalance === 'number' && !textHasAmount(reply, expected.currentBalance)) {
    fail('missing current balance');
  }
  if (typeof expected.dropAbs === 'number' && !textHasAmount(reply, expected.dropAbs)) {
    fail('missing drop');
  }
  if (typeof expected.periodLabel === 'string' && !reply.includes(expected.periodLabel)) {
    fail('missing period');
  }

  const anchors = expected.allowedExpenseAnchors;
  if (Array.isArray(anchors)) {
    const min =
      typeof expected.mustMentionLedgerItemsMin === 'number' ? expected.mustMentionLedgerItemsMin : 1;
    const hits = anchors.filter(
      (anchor) =>
        anchor &&
        typeof anchor === 'object' &&
        typeof (anchor as { amount?: number }).amount === 'number' &&
        textHasAmount(reply, (anchor as { amount: number }).amount)
    ).length;
    if (hits < min) fail(`ledger anchors ${hits} < ${min}`);
  }

  if (typeof expected.thresholdAbs === 'number' && !textHasAmount(reply, expected.thresholdAbs)) {
    fail('missing anomaly threshold');
  }
  const anomalous = expected.anomalousExpenses;
  if (Array.isArray(anomalous)) {
    for (const item of anomalous) {
      if (!item || typeof item !== 'object') continue;
      const amount = (item as { amount?: number }).amount;
      if (typeof amount === 'number' && !textHasAmount(reply, amount)) {
        fail(`missing anomaly ${amount}`);
      }
    }
  }
  const notAnomalous = expected.notAnomalous;
  if (Array.isArray(notAnomalous)) {
    for (const item of notAnomalous) {
      if (!item || typeof item !== 'object') continue;
      const amount = (item as { amount?: number }).amount;
      if (typeof amount !== 'number') continue;
      if (!textHasAmount(reply, amount) || !/מתחת לסף|לא מסומן כחריג|לא חריג/.test(reply)) {
        fail(`amount ${amount} should be explicitly below the anomaly line`);
      }
    }
  }

  if (typeof expected.apartment === 'string' && !reply.includes(expected.apartment)) {
    fail('missing draft apartment');
  }
  if (typeof expected.displayName === 'string' && !reply.includes(expected.displayName)) {
    fail('missing display name');
  }
  if (typeof expected.debtAbs === 'number' && !textHasAmount(reply, expected.debtAbs)) {
    fail('missing draft debt');
  }
  if (expected.mustBeDraftOnly === true) {
    if (!/טיוטה/.test(reply)) fail('not marked as draft');
    if (claimsMessageSent(reply)) fail('claims sent');
  }
  if (Array.isArray(expected.forbiddenPhrases) && claimsMessageSent(reply)) {
    fail('forbidden send claim');
  }
  if (expected.mustRefuseSend === true) {
    if (!/לא שולח|אינני שולח/.test(reply)) fail('did not refuse send');
    if (claimsMessageSent(reply)) fail('claims sent');
  }
  if (expected.mustRedirectToIntents === true) {
    if (!reply.includes('מי חייב') || !reply.includes('הודעת חוב')) {
      fail('did not redirect to intents');
    }
  }
  if (expected.mustSayMissing === true && !/חסר|אי אפשר לקבוע|לא מופיע/.test(reply)) {
    fail('did not say data is missing');
  }
  if (expected.mustNotInventDebtors === true) {
    if (apartmentsMentionedInReply(reply).length > 0) fail('invented a debtor apartment');
    if (/540|120|660/.test(reply.replace(/[,\s]/g, '')) && grounding.tenants.length === 0) {
      fail('invented a debt amount');
    }
  }

  return { pass: reasons.length === 0, reasons };
}

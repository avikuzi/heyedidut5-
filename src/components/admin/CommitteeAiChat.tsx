import React, { useMemo, useState } from 'react';
import { Copy, MessageSquareText, Send, Sparkles } from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';
import { buildAiGroundingContext } from '../../lib/aiGrounding';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient';

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  draft: boolean;
};

const SUGGESTIONS = [
  { label: 'מי חייב עכשיו?', message: 'מי חייב עכשיו?' },
  { label: 'למה ירדה היתרה?', message: 'למה ירדה היתרה החודש?' },
  { label: 'חריגות בהוצאות', message: 'יש חריגות בהוצאות?' }
];

async function readAccessToken(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token || null;
}

export const CommitteeAiChat: React.FC = () => {
  const { role, properties, transactions, activeMonth, dataSource } = useBuilding();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debtors = useMemo(
    () =>
      properties
        .filter((property) => property.currentBalance < 0)
        .sort((a, b) => a.propertyNumber - b.propertyNumber),
    [properties]
  );

  if (role !== 'admin') return null;

  const ask = async (message: string) => {
    const text = message.trim();
    if (!text || pending) return;
    setError(null);
    setPending(true);
    setDraft('');
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      draft: false
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const supabaseOn = isSupabaseConfigured() && dataSource === 'supabase';
      const token = supabaseOn ? await readAccessToken() : null;
      const payload: {
        message: string;
        periodLabel: string;
        grounding?: ReturnType<typeof buildAiGroundingContext>;
      } = { message: text, periodLabel: activeMonth };

      if (!supabaseOn) {
        payload.grounding = buildAiGroundingContext(properties, transactions, activeMonth);
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as { reply?: string; message?: string };
      if (!response.ok || !body.reply) {
        setError(body.message || 'העוזר לא הצליח להשיב.');
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: body.reply as string,
          draft: /טיוטה/.test(body.reply as string)
        }
      ]);
    } catch {
      setError('לא הצלחתי להתחבר לעוזר. נסו שוב.');
    } finally {
      setPending(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      setError('ההעתקה נכשלה. סמנו את הטיוטה והעתיקו ידנית.');
    }
  };

  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden" dir="rtl">
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-l from-emerald-50/80 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">עוזר הוועד</h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              עונה רק מנתוני הקופה והדיירים. טיוטות להעתקה בלבד — שום הודעה לא נשלחת לדיירים.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {dataSource === 'supabase'
                ? 'הנתונים נטענים בשרת מחשבון הוועד המחובר.'
                : 'מצב מקומי: הנתונים נלקחים מהדפדפן כי Supabase לא מוגדר.'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.message}
              type="button"
              disabled={pending}
              onClick={() => void ask(item.message)}
              className="text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 disabled:opacity-50 min-h-[40px]"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <div className="text-xs font-bold text-slate-500 mb-2">הכנת טיוטת הודעת חוב</div>
          {debtors.length === 0 ? (
            <p className="text-sm text-slate-500">אין כרגע דירות עם חוב פתוח לניסוח.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {debtors.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  disabled={pending}
                  onClick={() => void ask(`נסח הודעת חוב לדירה ${property.propertyNumber}`)}
                  className="text-sm font-bold px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 disabled:opacity-50 min-h-[40px]"
                >
                  טיוטה לדירה {property.propertyNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 min-h-[220px] max-h-[480px] overflow-y-auto p-4 space-y-3">
          {turns.length === 0 && (
            <div className="text-sm text-slate-500 leading-relaxed flex items-start gap-2">
              <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0" />
              <span>אפשר לשאול מי חייב, למה השתנתה היתרה, אם יש חריגות, או לבקש טיוטת הודעה לדירה.</span>
            </div>
          )}
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                turn.role === 'user'
                  ? 'bg-slate-900 text-white mr-8'
                  : 'bg-white border border-slate-200 text-slate-800 ml-8'
              }`}
            >
              {turn.text}
              {turn.role === 'assistant' && turn.draft && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => void copyText(turn.id, turn.text)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === turn.id ? 'הטיוטה הועתקה' : 'העתק טיוטה'}
                  </button>
                </div>
              )}
            </div>
          ))}
          {pending && <div className="text-sm text-slate-500">מכין תשובה מנתוני הקופה…</div>}
        </div>

        {error && (
          <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
        >
          <label className="sr-only" htmlFor="committee-ai-input">
            שאלה לוועד
          </label>
          <textarea
            id="committee-ai-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void ask(draft);
              }
            }}
            rows={2}
            placeholder="שאלה על חובות, יתרה, חריגות, או בקשה לטיוטה…"
            className="flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-black px-4 py-3 rounded-2xl min-h-[48px]"
          >
            <Send className="w-4 h-4" />
            שאל
          </button>
        </form>
      </div>
    </section>
  );
};

# הידידות 5 — חוזה שכבת AI (MVP)
**בעלים:** Vaad AI · **שותף אינטגרציה:** Vaad Eng  
**סטטוס:** v0.2 נעול מול פרוד · ספטמבר 2026  
**מבוסס על:** `mvp-course-onepager-he.md` (Locked) · סימון Vaad Eng מול `vaad_heyedidut5_rbac_v5_*`

---

## 1. תפקיד העוזר
צ׳אט לוועד הבית בלבד (לא לדיירים ב־MVP) שמשיב **רק** מנתוני קופה/דיירים שסופקו לו באותה בקשה (grounding), ומציע פעולה כשיש לה הצדקה בנתונים.

**טון:** עברית ברורה, קצרה, מנהלתית — בלי ז׳רגון AI, בלי הבטחות משפטיות.

---

## 2. מקרי שימוש נעולים (MVP)

| # | Intent | דוגמת שאלה | פלט נדרש | מקור grounding |
|---|--------|------------|----------|----------------|
| U1 | מי חייב / כמה | "מי חייב עכשיו?" | רשימת דירות + סכום חוב + סה״כ; או "אין חובות פתוחים" | `tenants[]` |
| U2 | למה ירדה היתרה | "למה ירדה היתרה החודש?" | סיכום תנועות + 2–3 פריטים גדולים | `ledger[]` + `fund` |
| U3 | חריגות בהוצאות | "יש חריגות בהוצאות?" | פריטים חריגים + הסבר קצר | `ledger[]` + `anomalyHints` |
| U4 | ניסוח הודעה | "נסח הודעת חוב לדירה 3" | טיוטה בעברית — **לא נשלחת** | דייר ספציפי + חוב |

שאלות מחוץ לארבעה: הפניה קצרה חזרה ל־4 ה־intents.

---

## 3. מיפוי פרוד → grounding (v0.2)

מקור פרוד: localStorage `vaad_heyedidut5_rbac_v5_*` (+ seed). אחרי ספרינט 1: אותם שדות מ־Supabase.

| שדה חוזה | מקור פרוד | הערות |
|----------|-----------|--------|
| `tenants[].apartment` | `properties.propertyNumber` | |
| `tenants[].displayName` | `properties.residents` | |
| `tenants[].balance` | `properties.currentBalance` | **שלילי = חוב** (מאומת בפרוד) |
| `tenants[].lastPaymentAt` | **derived** | תאריך tx `income` אחרון לפי `apartmentNumber` |
| `tenants[].paymentMethod` | `properties.payment_method` | אופציונלי; ריק לא נכנס ל־JSON |
| `tenants[].balanceNote` | `properties.balance_note` | אופציונלי; טלפון/אימייל לא נכללים |
| `ledger[]` | `transactions` / `_tx` | `note`←`description`, `apartment`←`apartmentNumber`; amount>0; type income\|expense |
| `fund.balance` | יתרה רצה / סכימת tx | |
| `fund.currency` | קבוע `"ILS"` | לא בשדה בפרוד |
| `fund.previousBalance` | **server-computed** בעת בניית grounding | |
| `fund.periodLabel` | **server-computed** (מ־UI month e.g. `2026-09`) | |
| `asOf` | **server-computed** (ISO) | |
| `building{id,name}` | **constant** עד טבלה | בניין יחיד: הידידות 5 |
| `anomalyHints` | **server-side only** | אין בפרוד — בסדר |
| עודפים בפרוד (לא בחוזה) | `reference`, running `balance`, `status` | מתעלמים |

---

## 4. טיפוס `AiGroundingContext`

```ts
type AiGroundingContext = {
  asOf: string;                 // server-computed ISO
  building: { name: string; id: string }; // constant עד טבלה
  fund: {
    balance: number;
    currency: "ILS";
    previousBalance?: number;   // server-computed
    periodLabel?: string;       // server-computed, e.g. "2026-09"
  };
  tenants: Array<{
    apartment: string;
    displayName: string;
    balance: number;            // שלילי = חוב (כמו currentBalance בפרוד)
    lastPaymentAt?: string;     // derived מ־tx income
    paymentMethod?: string;     // properties.payment_method
    balanceNote?: string;       // properties.balance_note
  }>;
  ledger: Array<{
    id: string;
    date: string;
    type: "income" | "expense";
    amount: number;             // תמיד חיובי
    category: string;
    note?: string;              // ← description
    apartment?: string;         // ← apartmentNumber
  }>;
  anomalyHints?: {
    expenseThresholdAbs?: number;
    expenseVsAvgMultiplier?: number;
  };
};
```

**כללי grounding:** חסר קריטי → אמור מה חסר · מספרים רק מ־context · אין המצאת דירות/סכומים.

---

## 5. System prompt (שלד)

```
אתה עוזר לוועד בית "הידידות 5". עונה בעברית קצרה ומדויקת.
משתמש רק בנתונים שב־CONTEXT. אם חסר — אמור מה חסר.
אל תחשוף נתוני דייר אחד כשנשאלת על אחר מעבר ל"דירה X חייבת Y".
אל תשלח הודעות; רק נסח טיוטה כשמבקשים.
אל תיתן ייעוץ משפטי/גבייה אגרסיבית — ניסוח מנומס ומקצועי.
כוסה רק: חובות, יתרת קופה והסבר שינוי, חריגות הוצאה, ניסוח הודעה לדירה.
```

---

## 6. פרטיות / מה אסור

| כלל | MVP |
|-----|-----|
| קהל | רק role=admin |
| דיירים | אין צ׳אט AI בפורטל דייר |
| שליחה | אין send אוטומטי — רק draft |
| הזיות | אסור מספר/דירה שלא ב־context |
| משפטי | בלי איומים / ייעוץ משפטי |
| מחוץ ל־scope | הפניה ל־4 intents בלבד |

---

## 7. Eval (DoD AI)

1. U1 "מי חייב?" → תואם tenants עם balance<0 + סה״כ  
2. U2 "למה ירדה היתרה?" → ≥2 תנועות מ־ledger  
3. U4 "נסח הודעה לדירה X" → סכום+דירה נכונים; לא טוען שנשלח  

**Fail מהיר:** מספר לא ב־context / דייר אחר / "שלחתי".

---

## 8. ממשק ל־Vaad Eng

1. `POST /api/ai/chat` ← `{ message, grounding }` → `{ reply, usedIntents? }` — **עדיין לא קיים**  
2. בניית grounding בשרת (כולל derived/computed) — לא מהקליינט  
3. UI בהמשך: צ׳אט בדשבורד ועד + כפתור "נסח הודעת חוב"

---

## 9. Next

- [x] סנכרון שדות מול פרוד (v0.2)
- [x] פרומפט מלא + few-shots
- [x] סט eval JSON
- [ ] כלל anomalyHints סופי
- [ ] אינטגרציה — רק אחרי API

---

*Vaad AI · v0.2 נעול מול סימון Vaad Eng*

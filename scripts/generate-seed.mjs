#!/usr/bin/env node
/**
 * Generates supabase/seed.sql from the existing in-app mock + excel ledger.
 * Run: node scripts/generate-seed.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILDING_ID = '00000000-0000-4000-a000-000000000005';

const properties = [
  {
    n: 1, type: 'residential', title: 'דירה 1', residents: 'עופר ודליה מי-טל',
    role: 'owner', floor: 1, due: 270, paid: true, special: true,
    method: 'העברה בנקאית', recurring: 'ה-10 בחודש', balance: 0,
    note: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית חודשית ישירה (מעודכן ל-270 ₪)'
  },
  {
    n: 2, type: 'residential', title: 'דירה 2', residents: 'אבי קוזי',
    role: 'admin', floor: 1, due: 270, paid: true, special: true,
    method: 'העברה בנקאית (הוראת קבע)', recurring: 'ה-5 בחודש', balance: 0,
    note: 'מוסדר במלואו',
    notes: 'ועד הבית (ניהול הבניין) • העברה בנקאית בהוראת קבע'
  },
  {
    n: 3, type: 'residential', title: 'דירה 3', residents: 'אמיר ומירי חנוכה',
    role: 'tenant', owner: 'יניב (בעל הדירה)', floor: 2, due: 270, paid: false, special: true,
    method: 'מזומן / אפליקציה לאבי', recurring: 'סביב ה-10 בחודש', balance: -540,
    note: 'חוב עבור חודשים יולי ואוגוסט 2026 (-540 ₪)',
    notes: 'דיירים שוכרים • משלם במזומן או באפליקציה (ביט/פייבוקס) לאבי הוועד. יתרת חוב: 540 ₪ (יולי ואוגוסט 2026).'
  },
  {
    n: 4, type: 'residential', title: 'דירה 4', residents: 'פרי ודורית ארנפלד',
    role: 'owner', floor: 2, due: 270, paid: true, special: true,
    method: 'העברה בנקאית (דיגיטל)', recurring: 'בין ה-3 ל-7 בחודש', balance: 0,
    note: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית דיגיטלית חודשית (מעודכן ל-270 ₪)'
  },
  {
    n: 5, type: 'residential', title: 'דירה 5', residents: 'אילנה',
    role: 'owner', floor: 3, due: 270, paid: false, special: true,
    method: 'העברה בנקאית (הוראת קבע על 250 ₪)', recurring: 'ה-20 בחודש', balance: -120,
    retro: 120,
    note: 'חוב הפרשי רטרו ממרץ: -120 ₪ (20 ₪ × 6 חודשים)',
    notes: 'בעלת נכס • הוראת הקבע מוגדרת על 250 ₪ במקום 270 ₪. נדרשת השלמת רטרו של 120 ₪ (מרץ עד אוגוסט) ועדכון הוראת הקבע.'
  },
  {
    n: 6, type: 'residential', title: 'דירה 6', residents: 'גולן שרון ומשפחתו',
    role: 'owner', floor: 3, due: 270, paid: true, special: true,
    method: 'העברה בנקאית (הוראת קבע)', recurring: 'ה-18 בחודש', balance: 0,
    note: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית בהוראת קבע חודשית (מעודכן ל-270 ₪)'
  },
  {
    n: 7, type: 'residential', title: 'דירה 7 (פנטהאוז)', residents: 'צחי ועיינה',
    role: 'owner', floor: 4, due: 405, paid: true, special: true,
    method: 'העברה בנקאית (אוצר החיל)', recurring: 'ה-10 בחודש', balance: 0,
    note: 'הפרשי הרטרו שולמו במלואם ב-30/08/2026 (180 ₪)',
    notes: 'פנטהאוז + יחידת דיור פנימית (דירה וחצי). תעריף מעודכן: 405 ₪. הפרש הרטרו בסך 180 ₪ (מרץ-אוגוסט) שולם במלואו ב-30/08/2026 בהעברה מבנק אוצר החיל.'
  },
  {
    n: 8, type: 'commercial', title: 'נכס 8 (קרקע)', residents: 'הנהלת סופר הכיכר (מכולת הבניין)',
    business: 'סופר הכיכר', role: 'business', floor: 0, due: 0, paid: true, special: true,
    method: "צ'ק שנתי (1,000 ₪)", recurring: 'תשלום שנתי מראש (מאי)', balance: 0,
    note: 'מוסדר לשנה שלמה מראש',
    notes: "המכולת של הבניין • שולם 1,000 ₪ תשלום שנתי מראש בצ'ק (נפרע בהצלחה בבנק) • שותפים מלאים בתחזוקה"
  },
  {
    n: 9, type: 'commercial', title: 'נכס 9 (קרקע)', residents: 'הנהלת מאפיית לחם בכפר (המאפייה)',
    business: 'מאפיית לחם בכפר', role: 'business', floor: 0, due: 0, paid: true, special: true,
    method: "צ'ק שנתי (1,000 ₪)", recurring: 'תשלום שנתי מראש (פברואר)', balance: 0,
    note: 'מוסדר לשנה שלמה מראש',
    notes: "המאפייה של הבניין • שולם 1,000 ₪ תשלום שנתי מראש בצ'ק (נפרע בהצלחה בבנק) • שותפים מלאים בתחזוקה"
  }
];

function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function propertyId(n) {
  return `10000000-0000-4000-a000-${String(n).padStart(12, '0')}`;
}

function txId(n) {
  return `20000000-0000-4000-a000-${String(n).padStart(12, '0')}`;
}

const txSource = fs.readFileSync(path.join(root, 'src/data/excelTransactions.ts'), 'utf8');
const start = txSource.indexOf('= [');
const end = txSource.lastIndexOf(']');
const transactions = JSON.parse(txSource.slice(start + 2, end + 1));

const propertySql = properties.map((p) => `  (
    '${propertyId(p.n)}',
    '${BUILDING_ID}',
    ${p.n},
    ${sqlStr(p.type)},
    ${sqlStr(p.title)},
    ${sqlStr(p.business || null)},
    ${sqlStr(p.residents)},
    ${sqlStr(p.role)},
    ${sqlStr(p.owner || null)},
    ${p.floor},
    ${p.due},
    ${p.special},
    ${p.paid},
    ${sqlStr(p.method)},
    ${sqlStr(p.recurring)},
    ${p.balance},
    ${sqlStr(p.note)},
    ${p.retro || 0},
    ${sqlStr(p.notes)}
  )`).join(',\n');

const txSql = transactions.map((t, idx) => {
  const n = idx + 1;
  return `  (
    '${txId(n)}',
    '${BUILDING_ID}',
    ${sqlStr(t.date)},
    ${sqlStr(t.description)},
    ${sqlStr(t.reference)},
    ${sqlStr(t.category)},
    ${sqlStr(t.type)},
    ${t.amount},
    ${t.balance == null ? 'NULL' : t.balance},
    ${sqlStr(t.status || 'completed')},
    ${t.apartmentNumber == null ? 'NULL' : t.apartmentNumber}
  )`;
}).join(',\n');

const out = `-- Demo seed for הידידות 5 (idempotent).
-- Generated by scripts/generate-seed.mjs from in-app mock + bank ledger.
-- Apply AFTER supabase/migrations/20260916120000_init_vaad.sql
-- Semantics: properties.current_balance < 0 means debt.

insert into public.buildings (id, name, address)
values (
  '${BUILDING_ID}',
  'הידידות 5',
  'הידידות 5, הוד השרון'
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address;

insert into public.properties (
  id, building_id, property_number, type, title, business_name, residents,
  resident_role, owner_name, floor, monthly_due, is_special_project_paid,
  is_paid_current_month, payment_method, recurring_day_text, current_balance,
  balance_note, retroactive_shortfall, notes
) values
${propertySql}
on conflict (id) do update set
  title = excluded.title,
  residents = excluded.residents,
  monthly_due = excluded.monthly_due,
  current_balance = excluded.current_balance,
  balance_note = excluded.balance_note,
  is_paid_current_month = excluded.is_paid_current_month,
  retroactive_shortfall = excluded.retroactive_shortfall,
  notes = excluded.notes;

insert into public.transactions (
  id, building_id, date, description, reference, category, type,
  amount, balance, status, apartment_number
) values
${txSql}
on conflict (id) do update set
  description = excluded.description,
  amount = excluded.amount,
  balance = excluded.balance,
  category = excluded.category,
  apartment_number = excluded.apartment_number;

insert into public.invitations (
  id, building_id, token, apartment_number, created_at, expires_at, is_used
) values
  ('30000000-0000-4000-a000-000000000007', '${BUILDING_ID}', 'test-tzachi-apt7', 7, '2026-08-29', '2027-12-31', false),
  ('30000000-0000-4000-a000-000000000001', '${BUILDING_ID}', 'test-ofer-apt1', 1, '2026-08-29', '2027-12-31', false),
  ('30000000-0000-4000-a000-000000000003', '${BUILDING_ID}', 'test-amir-apt3', 3, '2026-08-29', '2027-12-31', false)
on conflict (token) do nothing;

insert into public.broadcast_notices (
  id, building_id, title, content, date, author, category
) values
  (
    '40000000-0000-4000-a000-000000000001',
    '${BUILDING_ID}',
    'ברוכים הבאים לפורטל הדיירים האישי!',
    'דיירים יקרים, השקנו את הפורטל האישי שמאפשר לכל דירה לעקוב אחר תשלומיה, יתרת החשבון המעודכנת והודעות הוועד בפרטיות ובשקיפות מלאה.',
    '28/08/2026',
    'אבי קוזי (ועד הבית)',
    'announcement'
  ),
  (
    '40000000-0000-4000-a000-000000000002',
    '${BUILDING_ID}',
    'הודעת ועד: השלמת הפרשי דמי ועד רטרואקטיבית ממרץ',
    'תזכורת לדיירים שהתעריף עודכן ב-1 במרץ ב-20 ₪ לדירה (ל-270 ₪) וב-30 ₪ לפנטהאוז (ל-405 ₪ עקב דירה וחצי) לצורך כיסוי ביטוח המבנה המורחב. נשמח לעדכון ההעברות והסדרת ההפרשים הרטרואקטיביים.',
    '29/08/2026',
    'אבי קוזי (ועד הבית)',
    'maintenance'
  )
on conflict (id) do nothing;

-- Demo debts for the course (U1 "מי חייב"): apt 3 = -540, apt 5 = -120.
`;

fs.writeFileSync(path.join(root, 'supabase/seed.sql'), out);
console.log(`Wrote supabase/seed.sql (${properties.length} properties, ${transactions.length} transactions)`);

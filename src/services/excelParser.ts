import * as XLSX from 'xlsx';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { CATEGORY_MAP } from './categories';

/**
 * Intelligent categorization based on Hebrew bank keywords
 */
export function categorizeDescription(desc: string, type: TransactionType): TransactionCategory {
  const text = (desc || '').toLowerCase();

  if (type === 'expense') {
    if (text.includes('חשמל')) return 'electricity';
    if (text.includes('מעלי') || text.includes('כפיר') || text.includes('אלקטרה') || text.includes('ישראליפט')) return 'elevator';
    if (text.includes('גינון') || text.includes('גנן') || text.includes('השקיה')) return 'gardening';
    if (text.includes('ניקיון') || text.includes('משכורת') || text.includes('מנקה')) return 'cleaning';
    if (text.includes('מים') || text.includes('מי אביבים') || text.includes('תאגיד') || text.includes('הגיחון')) return 'water';
    if (text.includes('ביטוח') || text.includes('הראל') || text.includes('מגדל') || text.includes('איילון') || text.includes('כלל')) return 'insurance';
    if (text.includes('תיקון') || text.includes('אינסטלצ') || text.includes('משאב') || text.includes('מנעול') || text.includes('איטום')) return 'maintenance';
    if (text.includes('עמל') || text.includes('דמי כרטיס') || text.includes('שירות') || text.includes('עמלה')) return 'management';
    return 'other_expense';
  } else {
    if (text.includes('שיפוץ') || text.includes('קרן') || text.includes('מיוחד')) return 'special_fund';
    if (text.includes('חניה') || text.includes('מחסן')) return 'parking_rent';
    return 'tenant_dues';
  }
}

/**
 * Parse standard or HTML-based Israeli Bank XLS / XLSX / CSV file
 */
export async function parseStatementFile(file: File): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  if (rawRows.length === 0) {
    throw new Error('הקובץ ריק או שאינו מכיל נתונים קריאים.');
  }

  // Find header row containing Israeli bank keywords: תאריך, תיאור, חובה, זכות...
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let refCol = -1;
  let debitCol = -1; // חובה (Expense)
  let creditCol = -1; // זכות (Income)
  let balanceCol = -1; // יתרה

  for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
    const row = rawRows[r].map(c => String(c || '').trim());
    
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell.includes('תאריך') && dateCol === -1) dateCol = c;
      if ((cell.includes('תיאור') || cell.includes('פעולה')) && descCol === -1) descCol = c;
      if ((cell.includes('אסמכתא') || cell.includes('מספר')) && refCol === -1) refCol = c;
      if ((cell.includes('חובה') || cell.includes('בחובה')) && debitCol === -1) debitCol = c;
      if ((cell.includes('זכות') || cell.includes('בזכות')) && creditCol === -1) creditCol = c;
      if ((cell.includes('יתרה') || cell.includes('היתרה')) && balanceCol === -1) balanceCol = c;
    }

    if (dateCol !== -1 && (debitCol !== -1 || creditCol !== -1 || descCol !== -1)) {
      headerIndex = r;
      break;
    }
  }

  // If header not found automatically, fallback to common standard columns
  if (headerIndex === -1) {
    headerIndex = 0;
    dateCol = 0;
    descCol = 2;
    refCol = 3;
    debitCol = 4;
    creditCol = 5;
    balanceCol = 6;
  }

  const transactions: Transaction[] = [];

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawDate = row[dateCol];
    if (!rawDate) continue;

    const formattedDate = normalizeDate(rawDate);
    if (!formattedDate) continue;

    const desc = String(row[descCol] || 'תנועה בחשבון').trim();
    const ref = String(row[refCol] || `TX-${r}`).trim();

    const debitRaw = parseMoney(row[debitCol]);
    const creditRaw = parseMoney(row[creditCol]);
    const balanceRaw = parseMoney(row[balanceCol]);

    let type: TransactionType = 'expense';
    let amount = 0;

    if (creditRaw > 0 && debitRaw === 0) {
      type = 'income';
      amount = creditRaw;
    } else if (debitRaw > 0) {
      type = 'expense';
      amount = debitRaw;
    } else if (creditRaw > 0) {
      type = 'income';
      amount = creditRaw;
    } else {
      continue; // Skip 0 or empty rows
    }

    const category = categorizeDescription(desc, type);

    transactions.push({
      id: `imported-${Date.now()}-${r}`,
      date: formattedDate,
      description: desc,
      reference: ref,
      category,
      type,
      amount,
      balance: balanceRaw || undefined,
      status: 'completed'
    });
  }

  return transactions;
}

function parseMoney(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  const clean = String(val).replace(/[₪,\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.abs(num);
}

function normalizeDate(val: any): string {
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  // DD/MM/YYYY or DD/MM/YY
  const slashParts = str.split('/');
  if (slashParts.length === 3) {
    const d = slashParts[0].padStart(2, '0');
    const m = slashParts[1].padStart(2, '0');
    let y = slashParts[2];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  // YYYY-MM-DD
  const dashParts = str.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    return str;
  }
  return '';
}

/**
 * Export transactions to Excel (.xlsx) file
 */
export function exportTransactionsToExcel(transactions: Transaction[], filename = 'דוח_תנועות_ועד_בית.xlsx') {
  const exportData = transactions.map(t => ({
    'תאריך': t.date,
    'סוג': t.type === 'income' ? 'הכנסה' : 'הוצאה',
    'קטגוריה': CATEGORY_MAP[t.category]?.nameHe || t.category,
    'תיאור': t.description,
    'אסמכתא': t.reference,
    'סכום (₪)': t.amount,
    'יתרה לאחר תנועה (₪)': t.balance ?? '',
    'סטטוס': t.status === 'completed' ? 'הושלם' : (t.status === 'anomalous' ? 'חריג' : 'ממתין')
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'תנועות ועד בית');
  XLSX.writeFile(workbook, filename);
}

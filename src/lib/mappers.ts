import {
  InvitationToken,
  PropertyResident,
  TenantActivityLog,
  TenantBroadcastNotice,
  Transaction,
  User
} from '../types';
import { AiGroundingContext } from '../types/ai';
import {
  BroadcastNoticeRow,
  InvitationRow,
  ProfileRow,
  PropertyRow,
  TransactionRow
} from '../types/database';
import { FUND_CURRENCY, HEYEDIDUT_BUILDING_ID, HEYEDIDUT_BUILDING_NAME } from './constants';

function num(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function propertyFromRow(row: PropertyRow): PropertyResident {
  return {
    id: row.id,
    propertyNumber: row.property_number,
    type: row.type,
    title: row.title,
    businessName: row.business_name || undefined,
    residents: row.residents,
    residentRole: row.resident_role as PropertyResident['residentRole'],
    ownerName: row.owner_name || undefined,
    floor: row.floor,
    phone: row.phone || undefined,
    email: row.email || undefined,
    monthlyDue: num(row.monthly_due),
    isSpecialProjectPaid: row.is_special_project_paid,
    isPaidCurrentMonth: row.is_paid_current_month,
    paymentMethod: row.payment_method,
    recurringDayText: row.recurring_day_text || undefined,
    currentBalance: num(row.current_balance),
    balanceNote: row.balance_note || undefined,
    retroactiveShortfall: row.retroactive_shortfall == null ? undefined : num(row.retroactive_shortfall),
    notes: row.notes || undefined
  };
}

export function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    valueDate: row.value_date || undefined,
    description: row.description,
    reference: row.reference,
    category: row.category as Transaction['category'],
    type: row.type,
    amount: num(row.amount),
    balance: row.balance == null ? undefined : num(row.balance),
    status: (row.status as Transaction['status']) || 'completed',
    apartmentNumber: row.apartment_number ?? undefined,
    notes: row.notes || undefined,
    receiptUrl: row.receipt_url || undefined
  };
}

export function transactionToInsert(tx: Omit<Transaction, 'id'> | Transaction, buildingId: string) {
  return {
    ...( 'id' in tx && tx.id && !tx.id.startsWith('tx-') && !tx.id.startsWith('xls-tx-')
      ? { id: tx.id }
      : {}),
    building_id: buildingId,
    date: tx.date,
    value_date: tx.valueDate || null,
    description: tx.description,
    reference: tx.reference,
    category: tx.category,
    type: tx.type,
    amount: tx.amount,
    balance: tx.balance ?? null,
    status: tx.status,
    apartment_number: tx.apartmentNumber ?? tx.propertyId ?? null,
    notes: tx.notes || null,
    receipt_url: tx.receiptUrl || null
  };
}

export function userFromProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || '',
    role: row.role,
    apartmentNumber: row.apartment_number ?? 0,
    status: row.status,
    createdAt: row.created_at,
    lastActive: row.last_active || undefined,
    lastLogin: row.last_login || undefined,
    loginCount: row.login_count ?? 0
  };
}

export function invitationFromRow(row: InvitationRow): InvitationToken {
  return {
    id: row.id,
    token: row.token,
    apartmentNumber: row.apartment_number,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isUsed: row.is_used,
    usedByEmail: row.used_by_email || undefined
  };
}

export function noticeFromRow(row: BroadcastNoticeRow): TenantBroadcastNotice {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    author: row.author,
    category: row.category,
    targetApartment: row.target_apartment ?? undefined
  };
}

export function logFromActivity(row: {
  id: string;
  user_id: string | null;
  user_name: string;
  apartment_number: number;
  timestamp: string;
  action: TenantActivityLog['action'];
  details: string | null;
}): TenantActivityLog {
  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name,
    apartmentNumber: row.apartment_number,
    timestamp: row.timestamp,
    action: row.action,
    details: row.details || undefined
  };
}

/**
 * Maps live cashbox/tenant records to the v0.2 AI grounding contract.
 * Server-side equivalent: public.build_ai_grounding(period).
 */
export function buildAiGroundingContext(
  properties: PropertyResident[],
  transactions: Transaction[],
  periodLabel = '2026-09',
  building: { id: string; name: string } = {
    id: HEYEDIDUT_BUILDING_ID,
    name: HEYEDIDUT_BUILDING_NAME
  }
): AiGroundingContext {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentBalance = sorted[0]?.balance ?? 0;
  const previous = sorted.find((t) => t.date.slice(0, 7) < periodLabel);

  return {
    asOf: new Date().toISOString(),
    building,
    fund: {
      balance: currentBalance,
      currency: FUND_CURRENCY,
      previousBalance: previous?.balance,
      periodLabel
    },
    tenants: properties
      .slice()
      .sort((a, b) => a.propertyNumber - b.propertyNumber)
      .map((p) => {
        const lastIncome = sorted.find(
          (t) => t.type === 'income' && t.apartmentNumber === p.propertyNumber
        );
        const paymentMethod = p.paymentMethod?.trim();
        const balanceNote = p.balanceNote?.trim();
        return {
          apartment: String(p.propertyNumber),
          displayName: p.residents,
          balance: p.currentBalance,
          lastPaymentAt: lastIncome?.date,
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(balanceNote ? { balanceNote } : {})
        };
      }),
    ledger: sorted.slice(0, 200).map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.description,
      apartment: t.apartmentNumber != null ? String(t.apartmentNumber) : undefined
    })),
    anomalyHints: {
      expenseThresholdAbs: 2000,
      expenseVsAvgMultiplier: 1.15
    }
  };
}

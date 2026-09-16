#!/usr/bin/env node
/** Lightweight check that grounding mapping matches contract v0.2. */
function buildAiGroundingContext(properties, transactions, periodLabel = '2026-09') {
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentBalance = sorted[0]?.balance ?? 0;
  const previous = sorted.find((t) => t.date.slice(0, 7) < periodLabel);
  return {
    asOf: new Date().toISOString(),
    building: { id: 'b1', name: 'הידידות 5' },
    fund: {
      balance: currentBalance,
      currency: 'ILS',
      previousBalance: previous?.balance,
      periodLabel
    },
    tenants: properties.map((p) => {
      const lastIncome = sorted.find((t) => t.type === 'income' && t.apartmentNumber === p.propertyNumber);
      return {
        apartment: String(p.propertyNumber),
        displayName: p.residents,
        balance: p.currentBalance,
        lastPaymentAt: lastIncome?.date
      };
    }),
    ledger: sorted.map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.description,
      apartment: t.apartmentNumber != null ? String(t.apartmentNumber) : undefined
    }))
  };
}

const properties = [
  { propertyNumber: 3, residents: 'אמיר ומירי חנוכה', currentBalance: -540 },
  { propertyNumber: 5, residents: 'אילנה', currentBalance: -120 },
  { propertyNumber: 7, residents: 'צחי ועיינה', currentBalance: 0 }
];
const transactions = [
  { id: '1', date: '2026-09-04', type: 'expense', amount: 585, category: 'cleaning', description: 'משכורת', balance: 900.67 },
  { id: '2', date: '2026-08-30', type: 'income', amount: 180, category: 'tenant_dues', description: 'אוצר החיל', apartmentNumber: 7, balance: 1502.17 },
  { id: '3', date: '2026-08-20', type: 'income', amount: 250, category: 'tenant_dues', description: 'הוראת קבע', apartmentNumber: 5, balance: 1572.17 }
];

const ctx = buildAiGroundingContext(properties, transactions, '2026-09');
const debts = ctx.tenants.filter((t) => t.balance < 0);
if (ctx.fund.currency !== 'ILS') throw new Error('currency');
if (ctx.fund.balance !== 900.67) throw new Error('fund.balance should be latest running balance');
if (debts.length !== 2) throw new Error('expected 2 debts');
if (debts[0].apartment !== '3' || debts[0].balance !== -540) throw new Error('apt 3 debt');
if (ctx.tenants.find((t) => t.apartment === '7').lastPaymentAt !== '2026-08-30') throw new Error('lastPaymentAt');
if (ctx.ledger.some((l) => l.amount < 0)) throw new Error('ledger amounts must be positive');
if (ctx.ledger[0].note !== 'משכורת') throw new Error('note ← description');
console.log('grounding contract checks passed', {
  debts: debts.map((d) => `${d.apartment}:${d.balance}`),
  fund: ctx.fund.balance,
  ledger: ctx.ledger.length
});

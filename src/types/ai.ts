/**
 * AI grounding contract v0.2 — locked against prod cashbox/tenant fields.
 * Sprint 1 persists the source data in Postgres. Sprint 2 consumes this shape
 * via `build_ai_grounding()` (SQL) or `buildAiGroundingContext()` (client helper).
 * Do not invent extra tenant/ledger fields here without updating the contract.
 */
export type AiGroundingContext = {
  asOf: string;
  building: { name: string; id: string };
  fund: {
    balance: number;
    currency: 'ILS';
    previousBalance?: number;
    periodLabel?: string;
  };
  tenants: Array<{
    apartment: string;
    displayName: string;
    /** Negative = debt (same as properties.currentBalance in prod). */
    balance: number;
    lastPaymentAt?: string;
  }>;
  ledger: Array<{
    id: string;
    date: string;
    type: 'income' | 'expense';
    /** Always positive. */
    amount: number;
    category: string;
    note?: string;
    apartment?: string;
  }>;
  anomalyHints?: {
    expenseThresholdAbs?: number;
    expenseVsAvgMultiplier?: number;
  };
};

import { PropertyResident } from '../types';
import { formatCurrency } from '../services/financialAnalytics';

const MONEY_EPSILON = 0.009;

/** Properties with an open debt. Negative current_balance is the prod convention. */
export function openDebtProperties(properties: PropertyResident[]): PropertyResident[] {
  return properties
    .filter((property) => property.currentBalance < 0)
    .slice()
    .sort((a, b) => a.propertyNumber - b.propertyNumber);
}

export function outstandingDebtTotal(properties: PropertyResident[]): number {
  return openDebtProperties(properties).reduce(
    (sum, property) => sum + Math.abs(property.currentBalance),
    0
  );
}

/**
 * "N חודשים × monthly due" when amount / monthlyDue is a positive whole number of months.
 * Otherwise returns null so the UI does not invent a multiplier.
 */
export function monthsTimesMonthlyDue(amountAbs: number, monthlyDue: number): string | null {
  if (!(monthlyDue > 0) || !(amountAbs > 0)) return null;
  const months = Math.round(amountAbs / monthlyDue);
  if (months < 1) return null;
  if (Math.abs(amountAbs - months * monthlyDue) > MONEY_EPSILON) return null;
  const unit = months === 1 ? 'חודש' : 'חודשים';
  return `${months} ${unit} × ${formatCurrency(monthlyDue)}`;
}

/** |current_balance| / monthly_due when it divides evenly; otherwise no months line. */
export function debtMonthsLine(property: PropertyResident): string | null {
  return monthsTimesMonthlyDue(Math.abs(property.currentBalance), property.monthlyDue);
}

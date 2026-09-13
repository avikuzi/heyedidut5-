import { Anomaly, ExpenseCategory, Transaction } from '../types';
import { CATEGORY_MAP, RECURRING_EXPENSE_CATEGORIES } from './categories';

/**
 * Anomaly Detection Engine
 * Detects if an expense in recurring categories (Electricity, Elevator, Gardening, Cleaning, Water)
 * exceeds the trailing 3-month average by more than 15%.
 */
export function detectAnomalies(
  transactions: Transaction[],
  thresholdMultiplier = 1.15
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Sort transactions chronologically ascending
  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter only expenses
  const expenseTx = sortedTx.filter(t => t.type === 'expense');

  for (let i = 0; i < expenseTx.length; i++) {
    const currentTx = expenseTx[i];
    const category = currentTx.category as ExpenseCategory;

    // Only inspect recurring categories
    if (!RECURRING_EXPENSE_CATEGORIES.includes(category)) {
      continue;
    }

    const currentDate = new Date(currentTx.date);
    if (isNaN(currentDate.getTime())) continue;

    // Define 3-month trailing window (approx 92 days prior to current transaction date)
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Find historical expenses in the same category within the trailing 3-month window
    const historicalExpenses = expenseTx.filter(t => {
      if (t.id === currentTx.id || t.category !== category) return false;
      const tDate = new Date(t.date);
      return tDate >= threeMonthsAgo && tDate < currentDate;
    });

    if (historicalExpenses.length === 0) {
      // Fallback: If not enough recent data in 90 days, check prior 3 transactions in this category
      const priorCategoryTx = expenseTx
        .filter((t, idx) => idx < i && t.category === category)
        .slice(-3);

      if (priorCategoryTx.length >= 2) {
        const avg = priorCategoryTx.reduce((sum, t) => sum + t.amount, 0) / priorCategoryTx.length;
        checkAndPushAnomaly(currentTx, category, avg, thresholdMultiplier, anomalies);
      }
      continue;
    }

    const totalHistorical = historicalExpenses.reduce((sum, t) => sum + t.amount, 0);
    const trailing3MonthAvg = totalHistorical / historicalExpenses.length;

    checkAndPushAnomaly(currentTx, category, trailing3MonthAvg, thresholdMultiplier, anomalies);
  }

  // Return unique anomalies sorted by date descending (newest first)
  return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function checkAndPushAnomaly(
  tx: Transaction,
  category: ExpenseCategory,
  avg: number,
  thresholdMultiplier: number,
  anomalies: Anomaly[]
) {
  if (avg <= 0) return;

  const threshold = avg * thresholdMultiplier;
  if (tx.amount > threshold) {
    const percentageIncrease = ((tx.amount - avg) / avg) * 100;
    
    let severity: 'high' | 'medium' | 'critical' = 'medium';
    if (percentageIncrease > 50) {
      severity = 'critical';
    } else if (percentageIncrease > 30) {
      severity = 'high';
    }

    const categoryMeta = CATEGORY_MAP[category];
    const categoryNameHe = categoryMeta ? categoryMeta.nameHe : category;

    anomalies.push({
      id: `anomaly-${tx.id}`,
      transactionId: tx.id,
      category,
      categoryNameHe,
      date: tx.date,
      amount: tx.amount,
      trailing3MonthAvg: Math.round(avg * 100) / 100,
      percentageIncrease: Math.round(percentageIncrease * 10) / 10,
      description: `הוצאת ${categoryNameHe} (₪${tx.amount.toLocaleString('he-IL')}) חרגה ב-${Math.round(percentageIncrease)}% מעל הממוצע של 3 החודשים האחרונים (₪${Math.round(avg).toLocaleString('he-IL')})`,
      severity,
      isAcknowledged: false
    });
  }
}

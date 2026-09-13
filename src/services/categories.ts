import { CategoryMetadata, ExpenseCategory, TransactionCategory } from '../types';

export const CATEGORY_MAP: Record<TransactionCategory, CategoryMetadata> = {
  electricity: {
    id: 'electricity',
    nameHe: 'חשמל שטחים משותפים',
    isRecurring: true,
    type: 'expense',
    color: '#f59e0b',
    iconName: 'Zap'
  },
  elevator: {
    id: 'elevator',
    nameHe: 'שירות מעליות',
    isRecurring: true,
    type: 'expense',
    color: '#6366f1',
    iconName: 'ArrowUpDown'
  },
  gardening: {
    id: 'gardening',
    nameHe: 'גינון וטיפוח',
    isRecurring: true,
    type: 'expense',
    color: '#10b981',
    iconName: 'Trees'
  },
  cleaning: {
    id: 'cleaning',
    nameHe: 'ניקיון (אור)',
    isRecurring: true,
    type: 'expense',
    color: '#06b6d4',
    iconName: 'Sparkles'
  },
  water: {
    id: 'water',
    nameHe: 'מים ותאגיד',
    isRecurring: true,
    type: 'expense',
    color: '#3b82f6',
    iconName: 'Droplets'
  },
  insurance: {
    id: 'insurance',
    nameHe: 'ביטוח מבנה מורחב',
    isRecurring: true,
    type: 'expense',
    color: '#8b5cf6',
    iconName: 'ShieldCheck'
  },
  maintenance: {
    id: 'maintenance',
    nameHe: 'תחזוקה שוטפת',
    isRecurring: false,
    type: 'expense',
    color: '#ec4899',
    iconName: 'Wrench'
  },
  special_project: {
    id: 'special_project',
    nameHe: 'פרויקט צנרת וחירום',
    isRecurring: false,
    type: 'expense',
    color: '#ef4444',
    iconName: 'AlertOctagon'
  },
  management: {
    id: 'management',
    nameHe: 'עמלות וניהול חשבון',
    isRecurring: false,
    type: 'expense',
    color: '#64748b',
    iconName: 'Briefcase'
  },
  other_expense: {
    id: 'other_expense',
    nameHe: 'שונות הוצאות',
    isRecurring: false,
    type: 'expense',
    color: '#94a3b8',
    iconName: 'MoreHorizontal'
  },
  tenant_dues: {
    id: 'tenant_dues',
    nameHe: 'דמי ועד דירות (270 ₪)',
    isRecurring: true,
    type: 'income',
    color: '#22c55e',
    iconName: 'Home'
  },
  commercial_dues: {
    id: 'commercial_dues',
    nameHe: 'דמי ועד עסקים',
    isRecurring: true,
    type: 'income',
    color: '#10b981',
    iconName: 'Store'
  },
  parking_rent: {
    id: 'parking_rent',
    nameHe: 'השכרת חניה/מחסן',
    isRecurring: false,
    type: 'income',
    color: '#a855f7',
    iconName: 'Car'
  },
  special_fund: {
    id: 'special_fund',
    nameHe: 'גבייה מיוחדת צנרת (450 ₪)',
    isRecurring: false,
    type: 'income',
    color: '#14b8a6',
    iconName: 'PiggyBank'
  },
  other_income: {
    id: 'other_income',
    nameHe: 'הכנסות שונות',
    isRecurring: false,
    type: 'income',
    color: '#84cc16',
    iconName: 'PlusCircle'
  }
};

export const RECURRING_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'electricity',
  'elevator',
  'gardening',
  'cleaning',
  'water'
];

export function getCategoryName(category: TransactionCategory): string {
  return CATEGORY_MAP[category]?.nameHe || category;
}

export function isRecurringCategory(category: TransactionCategory): boolean {
  return CATEGORY_MAP[category]?.isRecurring ?? false;
}

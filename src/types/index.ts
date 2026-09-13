export type UserRole = 'admin' | 'tenant';

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'electricity'
  | 'elevator'
  | 'gardening'
  | 'cleaning'
  | 'water'
  | 'insurance'
  | 'maintenance'
  | 'special_project'
  | 'management'
  | 'other_expense';

export type IncomeCategory =
  | 'tenant_dues'
  | 'special_fund'
  | 'commercial_dues'
  | 'parking_rent'
  | 'other_income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface CategoryMetadata {
  id: TransactionCategory;
  nameHe: string;
  isRecurring: boolean;
  type: TransactionType;
  color: string;
  iconName: string;
}

export interface Transaction {
  id: string;
  date: string;
  valueDate?: string;
  description: string;
  reference: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  balance?: number;
  status: 'completed' | 'pending' | 'anomalous';
  propertyId?: number;
  apartmentNumber?: number;
  notes?: string;
  receiptUrl?: string;
}

export type PropertyType = 'residential' | 'commercial';

export interface PropertyResident {
  id: string;
  propertyNumber: number;
  type: PropertyType;
  title: string;
  businessName?: string;
  residents: string;
  residentRole: 'owner' | 'tenant' | 'admin' | 'business';
  ownerName?: string;
  floor: number;
  phone?: string;
  email?: string;
  monthlyDue: number;
  isSpecialProjectPaid: boolean;
  isPaidCurrentMonth: boolean;
  paymentMethod: string;
  recurringDayText?: string;
  currentBalance: number;
  balanceNote?: string;
  retroactiveShortfall?: number;
  notes?: string;
}

export type Tenant = PropertyResident;

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  apartmentNumber: number;
  status: 'active' | 'pending';
  createdAt: string;
  lastActive?: string;
  lastLogin?: string;
  loginCount?: number;
  password?: string;
}

export interface TenantActivityLog {
  id: string;
  userId: string;
  userName: string;
  apartmentNumber: number;
  timestamp: string;
  action: 'login' | 'view_ledger' | 'register';
  details?: string;
}

export interface InvitationToken {
  id: string;
  token: string;
  apartmentNumber: number;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedByEmail?: string;
}

export interface TenantBroadcastNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'announcement' | 'maintenance' | 'urgent';
  targetApartment?: number;
}

export interface Anomaly {
  id: string;
  transactionId: string;
  category: ExpenseCategory;
  categoryNameHe: string;
  date: string;
  amount: number;
  trailing3MonthAvg: number;
  percentageIncrease: number;
  description: string;
  severity: 'high' | 'medium' | 'critical';
  isAcknowledged: boolean;
  notes?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  category: 'maintenance' | 'community' | 'safety' | 'event';
  content: string;
  tip?: string;
  acknowledgedCount: number;
  isAcknowledgedByMe: boolean;
  author: string;
}

export interface CommunityDecision {
  id: string;
  title: string;
  date: string;
  status: 'approved' | 'in_progress';
  summary: string;
  votesDetail?: string;
  badgeText: string;
  category: 'insurance' | 'recognition' | 'maintenance';
}

export interface HazardReport {
  id: string;
  title: string;
  reportedBy: string;
  location: string;
  date: string;
  status: 'open' | 'in_treatment' | 'resolved';
  description: string;
}

export interface BuildingStats {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  outstandingDues: number;
  totalProperties: number;
  paidPropertiesCount: number;
  collectionRate: number;
  netCashFlow: number;
  anomaliesCount: number;
  totalApartments?: number;
  paidApartmentsCount?: number;
}

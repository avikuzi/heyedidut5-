export type DbRole = 'admin' | 'tenant';
export type DbPropertyType = 'residential' | 'commercial';
export type DbTxType = 'income' | 'expense';

export interface BuildingRow {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface PropertyRow {
  id: string;
  building_id: string;
  property_number: number;
  type: DbPropertyType;
  title: string;
  business_name: string | null;
  residents: string;
  resident_role: string;
  owner_name: string | null;
  floor: number;
  phone: string | null;
  email: string | null;
  monthly_due: number | string;
  is_special_project_paid: boolean;
  is_paid_current_month: boolean;
  payment_method: string;
  recurring_day_text: string | null;
  current_balance: number | string;
  balance_note: string | null;
  retroactive_shortfall: number | string | null;
  notes: string | null;
}

export interface ProfileRow {
  id: string;
  building_id: string | null;
  role: DbRole;
  apartment_number: number | null;
  name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'pending';
  last_login: string | null;
  last_active: string | null;
  login_count: number | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  building_id: string;
  date: string;
  value_date: string | null;
  description: string;
  reference: string;
  category: string;
  type: DbTxType;
  amount: number | string;
  balance: number | string | null;
  status: string;
  apartment_number: number | null;
  notes: string | null;
  receipt_url: string | null;
}

export interface InvitationRow {
  id: string;
  building_id: string;
  token: string;
  apartment_number: number;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_by_email: string | null;
}

export interface BroadcastNoticeRow {
  id: string;
  building_id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'announcement' | 'maintenance' | 'urgent';
  target_apartment: number | null;
}

export interface ActivityLogRow {
  id: string;
  building_id: string | null;
  user_id: string | null;
  user_name: string;
  apartment_number: number;
  timestamp: string;
  action: 'login' | 'view_ledger' | 'register';
  details: string | null;
}

export interface PeekInvitationResult {
  apartment_number: number;
  expires_at: string;
  is_used: boolean;
  property_title: string | null;
  residents: string | null;
}

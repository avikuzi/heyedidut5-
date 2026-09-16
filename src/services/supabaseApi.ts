import { HEYEDIDUT_BUILDING_ID } from '../lib/constants';
import {
  invitationFromRow,
  logFromActivity,
  noticeFromRow,
  propertyFromRow,
  transactionFromRow,
  transactionToInsert,
  userFromProfile
} from '../lib/mappers';
import { getSupabase } from '../lib/supabaseClient';
import {
  InvitationToken,
  PropertyResident,
  TenantActivityLog,
  TenantBroadcastNotice,
  Transaction,
  User
} from '../types';
import { PeekInvitationResult } from '../types/database';

function requireClient() {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase is not configured');
  }
  return client;
}

export async function fetchBuildingId(): Promise<string> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('buildings')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || HEYEDIDUT_BUILDING_ID;
}

export async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? userFromProfile(data) : null;
}

export async function fetchCoreData(): Promise<{
  properties: PropertyResident[];
  transactions: Transaction[];
  users: User[];
  invitations: InvitationToken[];
  broadcastNotices: TenantBroadcastNotice[];
  activityLogs: TenantActivityLog[];
}> {
  const supabase = requireClient();

  const [propertiesRes, txRes, profilesRes, invitesRes, noticesRes, logsRes] = await Promise.all([
    supabase.from('properties').select('*').order('property_number', { ascending: true }),
    supabase.from('transactions').select('*').order('date', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('invitations').select('*').order('created_at', { ascending: false }),
    supabase.from('broadcast_notices').select('*').order('date', { ascending: false }),
    supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200)
  ]);

  if (propertiesRes.error) throw propertiesRes.error;
  if (txRes.error) throw txRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (invitesRes.error) throw invitesRes.error;
  if (noticesRes.error) throw noticesRes.error;
  if (logsRes.error) throw logsRes.error;

  return {
    properties: (propertiesRes.data || []).map(propertyFromRow),
    transactions: (txRes.data || []).map(transactionFromRow),
    users: (profilesRes.data || []).map(userFromProfile),
    invitations: (invitesRes.data || []).map(invitationFromRow),
    broadcastNotices: (noticesRes.data || []).map(noticeFromRow),
    activityLogs: (logsRes.data || []).map(logFromActivity)
  };
}

export async function signInWithPassword(email: string, password: string): Promise<User> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error || !data.user) {
    throw new Error(error?.message || 'login_failed');
  }
  await supabase.rpc('touch_profile_login');
  const profile = await fetchProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('missing_profile');
  }
  return profile;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function peekInvitation(token: string): Promise<PeekInvitationResult | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc('peek_invitation', { p_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
}

export async function registerWithInvite(
  token: string,
  details: { name: string; email: string; phone: string; password: string }
): Promise<{ user: User | null; needsEmailConfirmation: boolean }> {
  const supabase = requireClient();
  const peeked = await peekInvitation(token);
  if (!peeked) {
    throw new Error('invite_not_found');
  }
  if (peeked.is_used) {
    throw new Error('invite_used');
  }

  const { data, error } = await supabase.auth.signUp({
    email: details.email.trim(),
    password: details.password,
    options: {
      data: {
        name: details.name.trim(),
        phone: details.phone.trim(),
        role: 'tenant',
        apartment_number: String(peeked.apartment_number),
        invite_token: token
      }
    }
  });
  if (error) {
    throw new Error(error.message);
  }

  const needsEmailConfirmation = !data.session;
  if (data.session && data.user) {
    await supabase.rpc('claim_invitation', { p_token: token });
    const profile = await fetchProfile(data.user.id);
    return { user: profile, needsEmailConfirmation: false };
  }

  return { user: null, needsEmailConfirmation };
}

export async function insertTransaction(
  buildingId: string,
  tx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionToInsert(tx, buildingId))
    .select('*')
    .single();
  if (error) throw error;
  return transactionFromRow(data);
}

export async function removeTransaction(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function insertTransactionsBatch(
  buildingId: string,
  txs: Transaction[]
): Promise<void> {
  if (txs.length === 0) return;
  const supabase = requireClient();
  const rows = txs.map((tx) => transactionToInsert(tx, buildingId));
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase.from('transactions').insert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
}

export async function updatePropertyPayment(
  propertyId: string,
  nextPaid: boolean,
  monthlyDue: number
): Promise<PropertyResident> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('properties')
    .update({
      is_paid_current_month: nextPaid,
      current_balance: nextPaid ? 0 : -monthlyDue
    })
    .eq('id', propertyId)
    .select('*')
    .single();
  if (error) throw error;
  return propertyFromRow(data);
}

export async function insertInvitation(
  buildingId: string,
  apartmentNumber: number,
  token: string,
  expiresAt: string
): Promise<InvitationToken> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      building_id: buildingId,
      apartment_number: apartmentNumber,
      token,
      created_at: new Date().toISOString().slice(0, 10),
      expires_at: expiresAt,
      is_used: false
    })
    .select('*')
    .single();
  if (error) throw error;
  return invitationFromRow(data);
}

export async function deleteInvitation(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('invitations').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteInvitationsForApartment(apartmentNumber: number): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('invitations').delete().eq('apartment_number', apartmentNumber);
  if (error) throw error;
}

export async function insertBroadcastNotice(
  buildingId: string,
  notice: Omit<TenantBroadcastNotice, 'id' | 'date'> & { date: string }
): Promise<TenantBroadcastNotice> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('broadcast_notices')
    .insert({
      building_id: buildingId,
      title: notice.title,
      content: notice.content,
      date: notice.date,
      author: notice.author,
      category: notice.category,
      target_apartment: notice.targetApartment ?? null
    })
    .select('*')
    .single();
  if (error) throw error;
  return noticeFromRow(data);
}

export async function deleteBroadcastNoticeRow(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('broadcast_notices').delete().eq('id', id);
  if (error) throw error;
}

export async function insertActivityLog(
  buildingId: string,
  log: Omit<TenantActivityLog, 'id'>
): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('activity_logs').insert({
    building_id: buildingId,
    user_id: log.userId || null,
    user_name: log.userName,
    apartment_number: log.apartmentNumber,
    timestamp: log.timestamp,
    action: log.action,
    details: log.details || null
  });
  if (error) {
    console.warn('activity log insert failed', error.message);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
  });
  if (error) throw error;
}

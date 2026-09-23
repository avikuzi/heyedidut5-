import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Anomaly,
  BuildingStats,
  CommunityDecision,
  HazardReport,
  InvitationToken,
  NoticeItem,
  PropertyResident,
  TenantActivityLog,
  TenantBroadcastNotice,
  Transaction,
  User,
  UserRole
} from '../types';
import {
  INITIAL_BROADCAST_NOTICES,
  INITIAL_DECISIONS,
  INITIAL_INVITATIONS,
  INITIAL_NOTICES,
  INITIAL_PROPERTIES,
  INITIAL_USERS
} from '../data/mockData';
import { REAL_EXCEL_TRANSACTIONS } from '../data/excelTransactions';
import { detectAnomalies } from '../services/anomalyDetector';
import { calculateBuildingStats } from '../services/financialAnalytics';
import { HEYEDIDUT_BUILDING_ID, LOCAL_STORAGE_KEY } from '../lib/constants';
import { getAdminEmail, getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import * as sb from '../services/supabaseApi';

interface PeekedInvitation {
  apartmentNumber: number;
  expiresAt: string;
  isUsed: boolean;
  propertyTitle?: string;
  residents?: string;
}

interface BuildingContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedProperty: number;
  setSelectedProperty: (propNum: number) => void;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  activeTab: 'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices' | 'assistant';
  setActiveTab: (
    tab: 'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices' | 'assistant'
  ) => void;

  properties: PropertyResident[];
  transactions: Transaction[];
  anomalies: Anomaly[];
  notices: NoticeItem[];
  decisions: CommunityDecision[];
  hazardReports: HazardReport[];
  stats: BuildingStats;

  currentUser: User | null;
  users: User[];
  invitationTokens: InvitationToken[];
  broadcastNotices: TenantBroadcastNotice[];
  activityLogs: TenantActivityLog[];
  inviteTokenFromUrl: string | null;
  setInviteTokenFromUrl: (token: string | null) => void;

  isLoading: boolean;
  dataSource: 'supabase' | 'local';
  buildingId: string;

  login: (email: string, password?: string, expectedRole?: UserRole) => Promise<boolean>;
  adminLogin: (password: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  registerWithToken: (
    token: string,
    data: { name: string; email: string; phone: string; password?: string }
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  peekInvitationInfo: (token: string) => Promise<PeekedInvitation | null>;
  generateInviteToken: (apartmentNumber: number) => InvitationToken;
  revokeInviteToken: (tokenId: string) => void;
  resetApartmentRegistration: (apartmentNumber: number) => void;
  resetAllTenants: () => void;
  publishBroadcastNotice: (notice: Omit<TenantBroadcastNotice, 'id' | 'date'>) => void;
  deleteBroadcastNotice: (noticeId: string) => void;
  requestPasswordHelp: (email: string) => Promise<{ ok: boolean; error?: string }>;

  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (newTransactions: Transaction[]) => void;
  resetToMockData: () => void;
  acknowledgeAnomaly: (anomalyId: string) => void;
  acknowledgeNotice: (noticeId: string) => void;
  togglePropertyPayment: (propertyId: string) => void;
  reportHazard: (hazard: { title: string; location: string; description: string; reportedBy: string }) => void;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

function nowHe(): string {
  return new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

function readLocal<T>(suffix: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${suffix}`);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const BuildingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseEnabled = isSupabaseConfigured();
  const dataSource: 'supabase' | 'local' = supabaseEnabled ? 'supabase' : 'local';

  const [inviteTokenFromUrl, setInviteTokenFromUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('invite') || null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(supabaseEnabled);
  const [buildingId, setBuildingId] = useState(HEYEDIDUT_BUILDING_ID);

  const [users, setUsers] = useState<User[]>(() => {
    if (supabaseEnabled) return [];
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.filter((u) => !u.email.includes('@heyedidut5.co.il'));
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (supabaseEnabled) return null;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_currentUser`);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (parsed && !parsed.email?.includes('@heyedidut5.co.il')) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<UserRole>(() => currentUser?.role || 'tenant');

  const setRole = (newRole: UserRole) => {
    if (currentUser?.role === 'tenant' && newRole === 'admin') {
      return;
    }
    setRoleState(newRole);
  };

  const [selectedProperty, setSelectedProperty] = useState<number>(() => currentUser?.apartmentNumber || 2);
  const [activeMonth, setActiveMonth] = useState<string>('2026-09');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices' | 'assistant'
  >('overview');

  const [invitationTokens, setInvitationTokens] = useState<InvitationToken[]>(() => {
    if (supabaseEnabled) return [];
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invitations`);
      const list: InvitationToken[] = saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
      INITIAL_INVITATIONS.forEach((initTok) => {
        if (!list.some((t) => t.token === initTok.token)) {
          list.push(initTok);
        }
      });
      return list;
    } catch {
      return INITIAL_INVITATIONS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<TenantActivityLog[]>(() => {
    if (supabaseEnabled) return [];
    return readLocal('activityLogs', [
      {
        id: 'act-init-1',
        userId: 'usr-sys',
        userName: 'מערכת ניהול הבניין',
        apartmentNumber: 0,
        timestamp: '29/08/2026, 10:00',
        action: 'register' as const,
        details: 'אתחול מערכת ניהול ומעקב דיירים'
      }
    ]);
  });

  const [broadcastNotices, setBroadcastNotices] = useState<TenantBroadcastNotice[]>(() => {
    if (supabaseEnabled) return [];
    return readLocal('broadcast_notices', INITIAL_BROADCAST_NOTICES);
  });

  const [properties, setProperties] = useState<PropertyResident[]>(() => {
    if (supabaseEnabled) return [];
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_properties`);
      if (saved) {
        const parsed: PropertyResident[] = JSON.parse(saved);
        return parsed.map((p) => {
          const init = INITIAL_PROPERTIES.find((ip) => ip.propertyNumber === p.propertyNumber);
          return {
            ...p,
            recurringDayText: p.recurringDayText || init?.recurringDayText,
            currentBalance: p.propertyNumber === 7 ? 0 : p.currentBalance,
            retroactiveShortfall: p.propertyNumber === 7 ? 0 : p.retroactiveShortfall
          };
        });
      }
      return INITIAL_PROPERTIES;
    } catch {
      return INITIAL_PROPERTIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (supabaseEnabled) return [];
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tx`);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        const reMapped = parsed.map((t) => {
          if (t.description.includes('משכורת') && (t.amount === 250 || t.amount === 250.0)) {
            return { ...t, category: 'gardening' as const };
          }
          if (t.description.includes('משכורת') && (t.amount === 585 || t.amount === 585.0)) {
            return { ...t, category: 'cleaning' as const };
          }
          return t;
        });
        const existingKeys = new Set(reMapped.map((t) => `${t.date}-${t.reference}-${t.amount}`));
        const newFromExcel = REAL_EXCEL_TRANSACTIONS.filter(
          (t) => !existingKeys.has(`${t.date}-${t.reference}-${t.amount}`)
        );
        if (newFromExcel.length > 0) {
          return [...newFromExcel, ...reMapped].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
        return reMapped;
      }
      return REAL_EXCEL_TRANSACTIONS;
    } catch {
      return REAL_EXCEL_TRANSACTIONS;
    }
  });

  const [notices, setNotices] = useState<NoticeItem[]>(() =>
    supabaseEnabled ? INITIAL_NOTICES : readLocal('notices', INITIAL_NOTICES)
  );

  const [decisions] = useState<CommunityDecision[]>(INITIAL_DECISIONS);

  const [hazardReports, setHazardReports] = useState<HazardReport[]>(() =>
    readLocal('hazards', [
      {
        id: 'haz-1',
        title: 'בדיקת תקינות סככת סופר הכיכר',
        location: 'סככת סופר הכיכר (חזית קרקע)',
        reportedBy: 'ועד הבית',
        date: '2026-08-15',
        status: 'resolved' as const,
        description:
          'ניקוי פסולת ובדיקת יריעת הסככה בשיתוף פעולה עם הנהלת המכולת וועד הבניין השכן.'
      }
    ])
  );

  const [acknowledgedAnomalyIds, setAcknowledgedAnomalyIds] = useState<string[]>([]);

  const applyRemoteCore = useCallback(
    (core: Awaited<ReturnType<typeof sb.fetchCoreData>>, profile: User | null) => {
      setProperties(core.properties);
      setTransactions(core.transactions);
      setUsers(core.users);
      setInvitationTokens(core.invitations);
      setBroadcastNotices(core.broadcastNotices);
      setActivityLogs(core.activityLogs);
      if (profile) {
        setCurrentUser(profile);
        setRoleState(profile.role);
        setSelectedProperty(profile.apartmentNumber || 2);
      }
    },
    []
  );

  const hydrateSupabaseSession = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setIsLoading(false);
      return;
    }
    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (!session?.user) {
        setCurrentUser(null);
        setProperties([]);
        setTransactions([]);
        setUsers([]);
        setIsLoading(false);
        return;
      }
      const bid = await sb.fetchBuildingId();
      setBuildingId(bid);
      const profile = await sb.fetchProfile(session.user.id);
      if (!profile) {
        await client.auth.signOut();
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      const core = await sb.fetchCoreData();
      applyRemoteCore(core, profile);
    } catch (err) {
      console.error('Supabase hydrate failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyRemoteCore]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    void hydrateSupabaseSession();
    const client = getSupabase();
    if (!client) return;
    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setProperties([]);
        setTransactions([]);
        setUsers([]);
        setInvitationTokens([]);
        setBroadcastNotices([]);
        setActivityLogs([]);
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void hydrateSupabaseSession();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabaseEnabled, hydrateSupabaseSession]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_notices`, JSON.stringify(notices));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hazards`, JSON.stringify(hazardReports));
      if (supabaseEnabled) return;
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_invitations`, JSON.stringify(invitationTokens));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_broadcast_notices`, JSON.stringify(broadcastNotices));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_activityLogs`, JSON.stringify(activityLogs));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_properties`, JSON.stringify(properties));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_tx`, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [
    supabaseEnabled,
    users,
    currentUser,
    invitationTokens,
    broadcastNotices,
    activityLogs,
    properties,
    transactions,
    notices,
    hazardReports
  ]);

  useEffect(() => {
    if (currentUser) {
      setRoleState(currentUser.role);
      setSelectedProperty(currentUser.apartmentNumber);
    }
  }, [currentUser]);

  const appendLog = (entry: TenantActivityLog) => {
    setActivityLogs((prev) => [entry, ...prev]);
    if (supabaseEnabled) {
      void sb.insertActivityLog(buildingId, entry);
    }
  };

  const login = async (
    email: string,
    password?: string,
    expectedRole?: UserRole
  ): Promise<boolean> => {
    if (supabaseEnabled) {
      if (!password) return false;
      try {
        const profile = await sb.signInWithPassword(email, password);
        if (expectedRole && profile.role !== expectedRole) {
          await sb.signOut();
          setCurrentUser(null);
          return false;
        }
        const core = await sb.fetchCoreData();
        applyRemoteCore(core, profile);
        appendLog({
          id: `act-${Date.now()}`,
          userId: profile.id,
          userName: profile.name,
          apartmentNumber: profile.apartmentNumber,
          timestamp: nowHe(),
          action: 'login',
          details:
            profile.role === 'admin'
              ? 'כניסת מנהל ועד הבית לדשבורד הראשי'
              : `התחברות לפורטל האישי (דירה ${profile.apartmentNumber})`
        });
        return true;
      } catch (err) {
        console.warn('Supabase login failed', err);
        return false;
      }
    }

    const user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!user) return false;
    if (expectedRole && user.role !== expectedRole) return false;
    if (user.password && password && user.password !== password) return false;
    const now = nowHe();
    const updatedUser: User = {
      ...user,
      lastLogin: now,
      lastActive: now,
      loginCount: (user.loginCount || 0) + 1
    };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setRoleState(user.role);
    setSelectedProperty(user.apartmentNumber);
    appendLog({
      id: `act-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      apartmentNumber: user.apartmentNumber,
      timestamp: now,
      action: 'login',
      details: `התחברות לפורטל האישי (דירה ${user.apartmentNumber})`
    });
    return true;
  };

  const adminLogin = async (password: string, email?: string): Promise<boolean> => {
    if (supabaseEnabled) {
      const adminEmail = (email || getAdminEmail()).trim();
      if (!adminEmail) return false;
      return login(adminEmail, password, 'admin');
    }

    const expected = import.meta.env.VITE_ADMIN_PASSWORD || 'avi2026';
    if (password !== expected) return false;
    const adminUser = users.find((u) => u.role === 'admin') || INITIAL_USERS[0];
    const now = nowHe();
    const updatedAdmin: User = {
      ...adminUser,
      lastLogin: now,
      lastActive: now,
      loginCount: (adminUser.loginCount || 0) + 1
    };
    setCurrentUser(updatedAdmin);
    setRoleState('admin');
    setSelectedProperty(2);
    appendLog({
      id: `act-${Date.now()}`,
      userId: adminUser.id,
      userName: 'אבי קוזי (ועד הבית)',
      apartmentNumber: 2,
      timestamp: now,
      action: 'login',
      details: 'כניסת מנהל ועד הבית לדשבורד הראשי'
    });
    return true;
  };

  const logout = async () => {
    if (supabaseEnabled) {
      await sb.signOut();
    }
    setCurrentUser(null);
    if (supabaseEnabled) {
      setProperties([]);
      setTransactions([]);
      setUsers([]);
    }
  };

  const switchUser = (userId: string) => {
    if (supabaseEnabled) return;
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setRoleState(target.role);
      setSelectedProperty(target.apartmentNumber);
    }
  };

  const peekInvitationInfo = useCallback(async (token: string): Promise<PeekedInvitation | null> => {
    if (supabaseEnabled) {
      const row = await sb.peekInvitation(token);
      if (!row) return null;
      return {
        apartmentNumber: row.apartment_number,
        expiresAt: row.expires_at,
        isUsed: row.is_used,
        propertyTitle: row.property_title || undefined,
        residents: row.residents || undefined
      };
    }
    const tokenObj = invitationTokens.find((t) => t.token === token);
    if (!tokenObj) return null;
    const prop = properties.find((p) => p.propertyNumber === tokenObj.apartmentNumber);
    return {
      apartmentNumber: tokenObj.apartmentNumber,
      expiresAt: tokenObj.expiresAt,
      isUsed: tokenObj.isUsed,
      propertyTitle: prop?.title,
      residents: prop?.residents
    };
  }, [supabaseEnabled, invitationTokens, properties]);

  const generateInviteToken = (apartmentNumber: number): InvitationToken => {
    const tokenStr = `inv-${apartmentNumber}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const newInvite: InvitationToken = {
      id: `tok-${Date.now()}`,
      token: tokenStr,
      apartmentNumber,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expires.toISOString().split('T')[0],
      isUsed: false
    };
    setInvitationTokens((prev) => [newInvite, ...prev]);
    if (supabaseEnabled) {
      void sb
        .insertInvitation(buildingId, apartmentNumber, tokenStr, newInvite.expiresAt)
        .then((saved) => {
          setInvitationTokens((prev) => prev.map((t) => (t.token === tokenStr ? saved : t)));
        })
        .catch((err) => console.error('invite insert failed', err));
    }
    return newInvite;
  };

  const revokeInviteToken = (tokenId: string) => {
    setInvitationTokens((prev) => prev.filter((t) => t.id !== tokenId));
    if (supabaseEnabled) {
      void sb.deleteInvitation(tokenId);
    }
  };

  const resetApartmentRegistration = (apartmentNumber: number) => {
    const targetUser = users.find((u) => u.apartmentNumber === apartmentNumber);
    setUsers((prev) => prev.filter((u) => u.apartmentNumber !== apartmentNumber));
    setInvitationTokens((prev) => prev.filter((t) => t.apartmentNumber !== apartmentNumber));
    if (supabaseEnabled) {
      void sb.deleteInvitationsForApartment(apartmentNumber);
    }
    appendLog({
      id: `act-${Date.now()}`,
      userId: targetUser?.id || 'del',
      userName: targetUser?.name || `דירה ${apartmentNumber}`,
      apartmentNumber,
      timestamp: nowHe(),
      action: 'login',
      details: `איפוס רישום עבור דירה ${apartmentNumber} על ידי הוועד`
    });
  };

  const resetAllTenants = () => {
    if (supabaseEnabled) return;
    setUsers(INITIAL_USERS);
    setInvitationTokens(INITIAL_INVITATIONS);
  };

  const registerWithToken = async (
    tokenString: string,
    data: { name: string; email: string; phone: string; password?: string }
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    if (supabaseEnabled) {
      try {
        const result = await sb.registerWithInvite(tokenString, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password || ''
        });
        if (result.needsEmailConfirmation) {
          return {
            success: true,
            needsEmailConfirmation: true
          };
        }
        if (result.user) {
          const core = await sb.fetchCoreData();
          applyRemoteCore(core, result.user);
          setInviteTokenFromUrl(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('invite_not_found')) {
          return { success: false, error: 'קישור ההזמנה אינו קיים או שגוי.' };
        }
        if (message.includes('invite_used')) {
          return { success: false, error: 'קישור הזמנה זה כבר נוצל בעבר ולא ניתן להשתמש בו שוב.' };
        }
        if (/already registered|already been registered|User already registered/i.test(message)) {
          return { success: false, error: 'כתובת דוא"ל זו כבר רשומה במערכת.' };
        }
        return { success: false, error: 'שגיאה בעת ההרשמה. בדקו את הפרטים ונסו שוב.' };
      }
    }

    const tokenObj = invitationTokens.find((t) => t.token === tokenString);
    if (!tokenObj) {
      return { success: false, error: 'קישור ההזמנה אינו קיים או שגוי.' };
    }
    if (tokenObj.isUsed) {
      return { success: false, error: 'קישור הזמנה זה כבר נוצל בעבר ולא ניתן להשתמש בו שוב.' };
    }
    const existing = users.find((u) => u.email.toLowerCase().trim() === data.email.toLowerCase().trim());
    if (existing) {
      return { success: false, error: 'כתובת דוא"ל זו כבר רשומה במערכת.' };
    }
    const now = nowHe();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: data.email.trim(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      role: 'tenant',
      apartmentNumber: tokenObj.apartmentNumber,
      status: 'active',
      createdAt: now,
      lastLogin: now,
      lastActive: now,
      loginCount: 1,
      password: data.password || '123'
    };
    setInvitationTokens((prev) =>
      prev.map((t) => (t.id === tokenObj.id ? { ...t, isUsed: true, usedByEmail: newUser.email } : t))
    );
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setRoleState('tenant');
    setSelectedProperty(tokenObj.apartmentNumber);
    setInviteTokenFromUrl(null);
    appendLog({
      id: `act-${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      apartmentNumber: newUser.apartmentNumber,
      timestamp: now,
      action: 'register',
      details: `הרשמה ראשונית מוצלחת לפורטל (דירה ${newUser.apartmentNumber})`
    });
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return { success: true };
  };

  const requestPasswordHelp = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabaseEnabled) return { ok: true };
    try {
      await sb.requestPasswordReset(email);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'reset_failed' };
    }
  };

  const publishBroadcastNotice = (noticeData: Omit<TenantBroadcastNotice, 'id' | 'date'>) => {
    const date = new Date().toLocaleDateString('he-IL');
    const localNotice: TenantBroadcastNotice = {
      id: `bn-${Date.now()}`,
      ...noticeData,
      date
    };
    setBroadcastNotices((prev) => [localNotice, ...prev]);
    if (supabaseEnabled) {
      void sb
        .insertBroadcastNotice(buildingId, { ...noticeData, date })
        .then((saved) => {
          setBroadcastNotices((prev) => prev.map((n) => (n.id === localNotice.id ? saved : n)));
        })
        .catch((err) => console.error('notice insert failed', err));
    }
  };

  const deleteBroadcastNotice = (noticeId: string) => {
    setBroadcastNotices((prev) => prev.filter((n) => n.id !== noticeId));
    if (supabaseEnabled) {
      void sb.deleteBroadcastNoticeRow(noticeId);
    }
  };

  const anomalies = useMemo(() => {
    const raw = detectAnomalies(transactions, 1.15);
    return raw.map((a) => ({
      ...a,
      isAcknowledged: acknowledgedAnomalyIds.includes(a.id)
    }));
  }, [transactions, acknowledgedAnomalyIds]);

  const stats = useMemo(() => {
    const s = calculateBuildingStats(transactions, properties, activeMonth);
    s.anomaliesCount = anomalies.filter((a) => !a.isAcknowledged).length;
    return s;
  }, [transactions, properties, activeMonth, anomalies]);

  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const localTx: Transaction = { ...txData, id: `tx-${Date.now()}` };
    setTransactions((prev) =>
      [localTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    if (supabaseEnabled) {
      void sb
        .insertTransaction(buildingId, txData)
        .then((saved) => {
          setTransactions((prev) =>
            prev
              .map((t) => (t.id === localTx.id ? saved : t))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        })
        .catch((err) => console.error('transaction insert failed', err));
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (supabaseEnabled) {
      void sb.removeTransaction(id);
    }
  };

  const importTransactions = (newTransactions: Transaction[]) => {
    setTransactions((prev) => {
      const existingKeys = new Set(prev.map((t) => `${t.date}-${t.reference}-${t.amount}`));
      const filteredNew = newTransactions.filter(
        (t) => !existingKeys.has(`${t.date}-${t.reference}-${t.amount}`)
      );
      if (supabaseEnabled && filteredNew.length > 0) {
        void sb.insertTransactionsBatch(buildingId, filteredNew).catch((err) => {
          console.error('transaction import failed', err);
        });
      }
      return [...filteredNew, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  };

  const acknowledgeNotice = (noticeId: string) => {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === noticeId) {
          const nextState = !n.isAcknowledgedByMe;
          return {
            ...n,
            isAcknowledgedByMe: nextState,
            acknowledgedCount: nextState ? n.acknowledgedCount + 1 : Math.max(0, n.acknowledgedCount - 1)
          };
        }
        return n;
      })
    );
  };

  const togglePropertyPayment = (propertyId: string) => {
    const target = properties.find((p) => p.id === propertyId);
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const nextPaid = !p.isPaidCurrentMonth;
          return {
            ...p,
            isPaidCurrentMonth: nextPaid,
            currentBalance: nextPaid ? 0 : -p.monthlyDue
          };
        }
        return p;
      })
    );
    if (supabaseEnabled && target) {
      const nextPaid = !target.isPaidCurrentMonth;
      void sb.updatePropertyPayment(propertyId, nextPaid, target.monthlyDue);
    }
  };

  const reportHazard = (hazard: {
    title: string;
    location: string;
    description: string;
    reportedBy: string;
  }) => {
    const newReport: HazardReport = {
      id: `haz-${Date.now()}`,
      ...hazard,
      date: new Date().toISOString().split('T')[0],
      status: 'open'
    };
    setHazardReports((prev) => [newReport, ...prev]);
  };

  const acknowledgeAnomaly = (anomalyId: string) => {
    setAcknowledgedAnomalyIds((prev) => [...prev, anomalyId]);
  };

  const resetToMockData = () => {
    if (supabaseEnabled) {
      void logout();
      return;
    }
    setProperties(INITIAL_PROPERTIES);
    setTransactions(REAL_EXCEL_TRANSACTIONS);
    setNotices(INITIAL_NOTICES);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setInvitationTokens(INITIAL_INVITATIONS);
    setBroadcastNotices(INITIAL_BROADCAST_NOTICES);
    setActivityLogs([]);
    setAcknowledgedAnomalyIds([]);
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_users`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_currentUser`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_invitations`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_broadcast_notices`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_activityLogs`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_properties`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_tx`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_notices`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_hazards`);
    } catch {
      /* ignore */
    }
  };

  return (
    <BuildingContext.Provider
      value={{
        role,
        setRole,
        selectedProperty,
        setSelectedProperty,
        activeMonth,
        setActiveMonth,
        activeTab,
        setActiveTab,
        properties,
        transactions,
        anomalies,
        notices,
        decisions,
        hazardReports,
        stats,
        currentUser,
        users,
        invitationTokens,
        broadcastNotices,
        activityLogs,
        inviteTokenFromUrl,
        setInviteTokenFromUrl,
        isLoading,
        dataSource,
        buildingId,
        login,
        adminLogin,
        logout,
        switchUser,
        registerWithToken,
        peekInvitationInfo,
        generateInviteToken,
        revokeInviteToken,
        resetApartmentRegistration,
        resetAllTenants,
        publishBroadcastNotice,
        deleteBroadcastNotice,
        requestPasswordHelp,
        addTransaction,
        deleteTransaction,
        importTransactions,
        resetToMockData,
        acknowledgeAnomaly,
        acknowledgeNotice,
        togglePropertyPayment,
        reportHazard
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
};

export const useBuilding = () => {
  const context = useContext(BuildingContext);
  if (!context) throw new Error('useBuilding must be used within a BuildingProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

interface BuildingContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedProperty: number;
  setSelectedProperty: (propNum: number) => void;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  activeTab: 'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices';
  setActiveTab: (tab: 'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices') => void;
  
  properties: PropertyResident[];
  transactions: Transaction[];
  anomalies: Anomaly[];
  notices: NoticeItem[];
  decisions: CommunityDecision[];
  hazardReports: HazardReport[];
  stats: BuildingStats;

  // Authentication & Users
  currentUser: User | null;
  users: User[];
  invitationTokens: InvitationToken[];
  broadcastNotices: TenantBroadcastNotice[];
  activityLogs: TenantActivityLog[];
  inviteTokenFromUrl: string | null;
  setInviteTokenFromUrl: (token: string | null) => void;

  // Auth Methods
  login: (email: string, password?: string) => boolean;
  adminLogin: (password: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  registerWithToken: (token: string, data: { name: string; email: string; phone: string; password?: string }) => { success: boolean; error?: string };
  generateInviteToken: (apartmentNumber: number) => InvitationToken;
  revokeInviteToken: (tokenId: string) => void;
  resetApartmentRegistration: (apartmentNumber: number) => void;
  resetAllTenants: () => void;
  publishBroadcastNotice: (notice: Omit<TenantBroadcastNotice, 'id' | 'date'>) => void;
  deleteBroadcastNotice: (noticeId: string) => void;
  
  // Existing Actions
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

const LOCAL_STORAGE_KEY = 'vaad_heyedidut5_rbac_v5';

export const BuildingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read token from URL query params: ?token=... or ?invite=...
  const [inviteTokenFromUrl, setInviteTokenFromUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('invite') || null;
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.filter(u => !u.email.includes('@heyedidut5.co.il'));
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Default currentUser: null so unauthenticated users land on login gateway
  // If previously logged in, restore session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_currentUser`);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (parsed && !parsed.email?.includes('@heyedidut5.co.il')) {
          return parsed;
        }
      }
      return null; // Force login screen for privacy
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<UserRole>(() => currentUser?.role || 'tenant');

  const setRole = (newRole: UserRole) => {
    // If current logged-in user is a tenant, strictly forbid switching to admin!
    if (currentUser?.role === 'tenant' && newRole === 'admin') {
      return;
    }
    setRoleState(newRole);
  };

  const [selectedProperty, setSelectedProperty] = useState<number>(() => currentUser?.apartmentNumber || 2);
  const [activeMonth, setActiveMonth] = useState<string>('2026-09');
  const [activeTab, setActiveTab] = useState<'overview' | 'residents' | 'tenants_mgmt' | 'financials' | 'insurance' | 'notices'>('overview');

  const [invitationTokens, setInvitationTokens] = useState<InvitationToken[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invitations`);
      const list: InvitationToken[] = saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
      INITIAL_INVITATIONS.forEach(initTok => {
        if (!list.some(t => t.token === initTok.token)) {
          list.push(initTok);
        }
      });
      return list;
    } catch {
      return INITIAL_INVITATIONS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<TenantActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activityLogs`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'act-init-1',
          userId: 'usr-sys',
          userName: 'מערכת ניהול הבניין',
          apartmentNumber: 0,
          timestamp: '29/08/2026, 10:00',
          action: 'register',
          details: 'אתחול מערכת ניהול ומעקב דיירים'
        }
      ];
    } catch {
      return [];
    }
  });

  const [broadcastNotices, setBroadcastNotices] = useState<TenantBroadcastNotice[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_broadcast_notices`);
      return saved ? JSON.parse(saved) : INITIAL_BROADCAST_NOTICES;
    } catch {
      return INITIAL_BROADCAST_NOTICES;
    }
  });

  const [properties, setProperties] = useState<PropertyResident[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_properties`);
      if (saved) {
        const parsed: PropertyResident[] = JSON.parse(saved);
        // Ensure recurringDayText is always mapped from INITIAL_PROPERTIES
        return parsed.map(p => {
          const init = INITIAL_PROPERTIES.find(ip => ip.propertyNumber === p.propertyNumber);
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
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tx`);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        // Re-map 250 NIS salary transfers to gardening
        const reMapped = parsed.map(t => {
          if (t.description.includes('משכורת') && (t.amount === 250 || t.amount === 250.0)) {
            return { ...t, category: 'gardening' as const };
          }
          if (t.description.includes('משכורת') && (t.amount === 585 || t.amount === 585.0)) {
            return { ...t, category: 'cleaning' as const };
          }
          return t;
        });

        // Automatically merge any new transactions from the updated Excel
        const existingKeys = new Set(reMapped.map(t => `${t.date}-${t.reference}-${t.amount}`));
        const newFromExcel = REAL_EXCEL_TRANSACTIONS.filter(t => !existingKeys.has(`${t.date}-${t.reference}-${t.amount}`));
        if (newFromExcel.length > 0) {
          const merged = [...newFromExcel, ...reMapped].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return merged;
        }
        return reMapped;
      }
      return REAL_EXCEL_TRANSACTIONS;
    } catch {
      return REAL_EXCEL_TRANSACTIONS;
    }
  });

  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notices`);
      return saved ? JSON.parse(saved) : INITIAL_NOTICES;
    } catch {
      return INITIAL_NOTICES;
    }
  });

  const [decisions] = useState<CommunityDecision[]>(INITIAL_DECISIONS);

  const [hazardReports, setHazardReports] = useState<HazardReport[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_hazards`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'haz-1',
          title: 'בדיקת תקינות סככת סופר הכיכר',
          location: 'סככת סופר הכיכר (חזית קרקע)',
          reportedBy: 'ועד הבית',
          date: '2026-08-15',
          status: 'resolved',
          description: 'ניקוי פסולת ובדיקת יריעת הסככה בשיתוף פעולה עם הנהלת המכולת וועד הבניין השכן.'
        }
      ];
    } catch {
      return [];
    }
  });

  const [acknowledgedAnomalyIds, setAcknowledgedAnomalyIds] = useState<string[]>([]);

  // Persist State
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_invitations`, JSON.stringify(invitationTokens));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_broadcast_notices`, JSON.stringify(broadcastNotices));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_activityLogs`, JSON.stringify(activityLogs));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_properties`, JSON.stringify(properties));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_tx`, JSON.stringify(transactions));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_notices`, JSON.stringify(notices));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_hazards`, JSON.stringify(hazardReports));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [users, currentUser, invitationTokens, broadcastNotices, activityLogs, properties, transactions, notices, hazardReports]);

  // Keep role & selectedProperty aligned with currentUser
  useEffect(() => {
    if (currentUser) {
      setRoleState(currentUser.role);
      setSelectedProperty(currentUser.apartmentNumber);
    }
  }, [currentUser]);

  // Authentication Handlers
  const login = (email: string, password?: string): boolean => {
    const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (user) {
      const now = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
      const updatedUser: User = {
        ...user,
        lastLogin: now,
        lastActive: now,
        loginCount: (user.loginCount || 0) + 1
      };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setRoleState(user.role);
      setSelectedProperty(user.apartmentNumber);

      // Audit Log
      const logEntry: TenantActivityLog = {
        id: `act-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        apartmentNumber: user.apartmentNumber,
        timestamp: now,
        action: 'login',
        details: `התחברות לפורטל האישי (דירה ${user.apartmentNumber})`
      };
      setActivityLogs(prev => [logEntry, ...prev]);

      return true;
    }
    return false;
  };

  const adminLogin = (password: string): boolean => {
    // Password for building manager (Avi)
    // Client-side gate only — not real security. Do not expose this value in the UI.
    // TODO: move committee auth to a server-side provider.
    const expected = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'avi2026';
    if (password === expected) {
      const adminUser = users.find(u => u.role === 'admin') || INITIAL_USERS[0];
      const now = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
      const updatedAdmin: User = {
        ...adminUser,
        lastLogin: now,
        lastActive: now,
        loginCount: (adminUser.loginCount || 0) + 1
      };
      setCurrentUser(updatedAdmin);
      setRoleState('admin');
      setSelectedProperty(2);

      const logEntry: TenantActivityLog = {
        id: `act-${Date.now()}`,
        userId: adminUser.id,
        userName: 'אבי קוזי (ועד הבית)',
        apartmentNumber: 2,
        timestamp: now,
        action: 'login',
        details: 'כניסת מנהל ועד הבית לדשבורד הראשי'
      };
      setActivityLogs(prev => [logEntry, ...prev]);

      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setRoleState(target.role);
      setSelectedProperty(target.apartmentNumber);
    }
  };

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

    setInvitationTokens(prev => [newInvite, ...prev]);
    return newInvite;
  };

  const revokeInviteToken = (tokenId: string) => {
    setInvitationTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  const resetApartmentRegistration = (apartmentNumber: number) => {
    const targetUser = users.find(u => u.apartmentNumber === apartmentNumber);
    setUsers(prev => prev.filter(u => u.apartmentNumber !== apartmentNumber));
    setInvitationTokens(prev => prev.filter(t => t.apartmentNumber !== apartmentNumber));

    const now = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}`,
        userId: targetUser?.id || 'del',
        userName: targetUser?.name || `דירה ${apartmentNumber}`,
        apartmentNumber,
        timestamp: now,
        action: 'login',
        details: `איפוס רישום עבור דירה ${apartmentNumber} על ידי הוועד`
      },
      ...prev
    ]);
  };

  const resetAllTenants = () => {
    setUsers(INITIAL_USERS);
    setInvitationTokens(INITIAL_INVITATIONS);
  };

  const registerWithToken = (
    tokenString: string, 
    data: { name: string; email: string; phone: string; password?: string }
  ): { success: boolean; error?: string } => {
    const tokenObj = invitationTokens.find(t => t.token === tokenString);
    if (!tokenObj) {
      return { success: false, error: 'קישור ההזמנה אינו קיים או שגוי.' };
    }
    if (tokenObj.isUsed) {
      return { success: false, error: 'קישור הזמנה זה כבר נוצל בעבר ולא ניתן להשתמש בו שוב.' };
    }

    const existing = users.find(u => u.email.toLowerCase().trim() === data.email.toLowerCase().trim());
    if (existing) {
      return { success: false, error: 'כתובת דוא"ל זו כבר רשומה במערכת.' };
    }

    const now = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });

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

    // Mark token as used
    setInvitationTokens(prev => prev.map(t => {
      if (t.id === tokenObj.id) {
        return { ...t, isUsed: true, usedByEmail: newUser.email };
      }
      return t;
    }));

    // Add user and set as current logged-in user
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setRoleState('tenant');
    setSelectedProperty(tokenObj.apartmentNumber);
    setInviteTokenFromUrl(null);

    // Audit Log Entry
    const logEntry: TenantActivityLog = {
      id: `act-${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      apartmentNumber: newUser.apartmentNumber,
      timestamp: now,
      action: 'register',
      details: `הרשמה ראשונית מוצלחת לפורטל (דירה ${newUser.apartmentNumber})`
    };
    setActivityLogs(prev => [logEntry, ...prev]);

    // Clean URL query parameters
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return { success: true };
  };

  const publishBroadcastNotice = (noticeData: Omit<TenantBroadcastNotice, 'id' | 'date'>) => {
    const newNotice: TenantBroadcastNotice = {
      id: `bn-${Date.now()}`,
      ...noticeData,
      date: new Date().toLocaleDateString('he-IL')
    };
    setBroadcastNotices(prev => [newNotice, ...prev]);
  };

  const deleteBroadcastNotice = (noticeId: string) => {
    setBroadcastNotices(prev => prev.filter(n => n.id !== noticeId));
  };

  const anomalies = useMemo(() => {
    const raw = detectAnomalies(transactions, 1.15);
    return raw.map(a => ({
      ...a,
      isAcknowledged: acknowledgedAnomalyIds.includes(a.id)
    }));
  }, [transactions, acknowledgedAnomalyIds]);

  const stats = useMemo(() => {
    const s = calculateBuildingStats(transactions, properties, activeMonth);
    s.anomaliesCount = anomalies.filter(a => !a.isAcknowledged).length;
    return s;
  }, [transactions, properties, activeMonth, anomalies]);

  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const importTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => {
      const existingKeys = new Set(prev.map(t => `${t.date}-${t.reference}-${t.amount}`));
      const filteredNew = newTransactions.filter(t => !existingKeys.has(`${t.date}-${t.reference}-${t.amount}`));
      return [...filteredNew, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const acknowledgeNotice = (noticeId: string) => {
    setNotices(prev => prev.map(n => {
      if (n.id === noticeId) {
        const nextState = !n.isAcknowledgedByMe;
        return {
          ...n,
          isAcknowledgedByMe: nextState,
          acknowledgedCount: nextState ? n.acknowledgedCount + 1 : Math.max(0, n.acknowledgedCount - 1)
        };
      }
      return n;
    }));
  };

  const togglePropertyPayment = (propertyId: string) => {
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        const nextPaid = !p.isPaidCurrentMonth;
        return {
          ...p,
          isPaidCurrentMonth: nextPaid,
          currentBalance: nextPaid ? 0 : -p.monthlyDue
        };
      }
      return p;
    }));
  };

  const reportHazard = (hazard: { title: string; location: string; description: string; reportedBy: string }) => {
    const newReport: HazardReport = {
      id: `haz-${Date.now()}`,
      ...hazard,
      date: new Date().toISOString().split('T')[0],
      status: 'open'
    };
    setHazardReports(prev => [newReport, ...prev]);
  };

  const acknowledgeAnomaly = (anomalyId: string) => {
    setAcknowledgedAnomalyIds(prev => [...prev, anomalyId]);
  };

  const resetToMockData = () => {
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
    } catch {}
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
        login,
        adminLogin,
        logout,
        switchUser,
        registerWithToken,
        generateInviteToken,
        revokeInviteToken,
        resetApartmentRegistration,
        resetAllTenants,
        publishBroadcastNotice,
        deleteBroadcastNotice,
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

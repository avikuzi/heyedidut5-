import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  KeyRound, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';

export const PortalGateway: React.FC = () => {
  const { login, adminLogin, users } = useBuilding();

  const [activeTab, setActiveTab] = useState<'tenant' | 'admin'>('tenant');
  
  // Tenant form
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  const [tenantError, setTenantError] = useState<string | null>(null);

  // Admin form
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleTenantLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);
    const success = login(tenantEmail, tenantPassword);
    if (!success) {
      setTenantError('לא נמצא משתמש פעיל עם כתובת דוא"ל זו. נא ודא שנרשמת תחילה דרך קישור ההזמנה האישי שנשלח אליך מהוועד.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const success = adminLogin(adminPass);
    if (!success) {
      setAdminError('סיסמת ניהול שגויה. נסה שוב, או פנה למנהל המערכת אם שכחת את הסיסמה.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-hebrew text-right">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            ועד הבית • הידידות 5
          </h1>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            הוד השרון • מערכת ניהול ופורטל דיירים מאובטח
          </p>
        </div>

        {/* Tab Selector: Tenant vs Admin */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-black">
          <button
            type="button"
            onClick={() => { setActiveTab('tenant'); setTenantError(null); }}
            className={`py-3 rounded-xl transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
              activeTab === 'tenant'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            כניסת דייר לפורטל
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setAdminError(null); }}
            className={`py-3 rounded-xl transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            כניסת ועד הבית
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* TENANT LOGIN */}
          {activeTab === 'tenant' && (
            <form onSubmit={handleTenantLogin} method="post" className="space-y-4">
              <div>
                <label htmlFor="tenant-email" className="block text-xs font-bold text-slate-700 mb-1">
                  כתובת הדוא"ל שלך:
                </label>
                <div className="relative">
                  <input
                    id="tenant-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="name@email.com"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl py-3 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="tenant-password" className="block text-xs font-bold text-slate-700 mb-1">
                  סיסמה:
                </label>
                <div className="relative">
                  <input
                    id="tenant-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={tenantPassword}
                    onChange={(e) => setTenantPassword(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl py-3 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {tenantError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{tenantError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                כניסה לפורטל האישי שלי
              </button>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-black block mb-0.5">דייר חדש בבניין?</span>
                ההרשמה הראשונית מתבצעת אך ורק דרך קישור הזמנה אישי ומאובטח המונפק על ידי ועד הבית עבור דירתך.
              </div>
            </form>
          )}

          {/* ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} method="post" className="space-y-4">
              <div>
                <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 mb-1">
                  סיסמת ניהול ועד הבית:
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="הזן סיסמת ועד"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl py-3 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <ShieldCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {adminError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black active:scale-98 text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                כניסה לדשבורד הניהול
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

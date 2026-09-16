import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  KeyRound, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  Shield,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  CheckCircle2,
  Wallet,
  Bell,
  FileText
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';

type GatewayStep = 'choose' | 'tenant' | 'admin' | 'help';

export const PortalGateway: React.FC = () => {
  const { login, adminLogin, dataSource, requestPasswordHelp } = useBuilding();

  const [step, setStep] = useState<GatewayStep>('choose');
  
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantBusy, setTenantBusy] = useState(false);

  const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim();
  const [adminEmail, setAdminEmail] = useState(configuredAdminEmail);
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);

  const [helpEmail, setHelpEmail] = useState('');
  const [helpSent, setHelpSent] = useState(false);

  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);
    setTenantBusy(true);
    const success = await login(tenantEmail, tenantPassword, 'tenant');
    setTenantBusy(false);
    if (!success) {
      setTenantError('הכניסה נכשלה. בדקו אימייל וסיסמה, או בקשו עזרה מוועד הבית.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminBusy(true);
    const success = await adminLogin(adminPass, adminEmail);
    setAdminBusy(false);
    if (!success) {
      setAdminError(
        dataSource === 'supabase'
          ? 'הכניסה נכשלה. בדקו דוא״ל וסיסמה של ועד הבית.'
          : 'סיסמת ניהול שגויה. נסו שוב.'
      );
    }
  };

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestPasswordHelp(helpEmail);
    setHelpSent(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-hebrew text-right">
      <div className="w-full max-w-3xl grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
        
        {/* Desktop / tablet product intro */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-7 shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-snug">
              הידידות 5
              <span className="block text-lg font-bold text-indigo-200 mt-1">פורטל דיירים וועד הבית</span>
            </h1>
            <p className="text-sm text-indigo-200/90 mt-3 leading-relaxed">
              הוד השרון · מעקב תשלומים, יתרות והודעות הוועד במקום אחד.
            </p>
          </div>

          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <span>יתרת חשבון ודמי ועד לכל דירה</span>
            </li>
            <li className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <span>הודעות ועד ועדכונים לקהילה</span>
            </li>
            <li className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <span>שקיפות בתשלומים שנקלטו בבנק</span>
            </li>
          </ul>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight">הידידות 5</h1>
            <p className="text-sm text-indigo-200 mt-1 font-medium">
              פורטל דיירים וועד הבית · הוד השרון
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5 flex-1">
            {step !== 'choose' && (
              <button
                type="button"
                onClick={() => {
                  setStep('choose');
                  setTenantError(null);
                  setAdminError(null);
                  setHelpSent(false);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900 min-h-[44px]"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לבחירה
              </button>
            )}

            {/* STEP: choose role */}
            {step === 'choose' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">איך תרצו להיכנס?</h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    בחרו את סוג הכניסה. לכל דייר פורטל אישי; לוועד הבית יש דשבורד ניהול.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('tenant')}
                  className="w-full text-right p-4 sm:p-5 rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 transition-all min-h-[72px] flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-black text-slate-900">אני דייר/ת</div>
                    <div className="text-sm text-slate-600 mt-0.5">כניסה לפורטל האישי של הדירה</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('admin')}
                  className="w-full text-right p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-800 bg-slate-50 hover:bg-slate-100 transition-all min-h-[72px] flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-black text-slate-900">אני ועד הבית</div>
                    <div className="text-sm text-slate-600 mt-0.5">כניסה לדשבורד הניהול</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('help')}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 min-h-[44px]"
                >
                  <HelpCircle className="w-4 h-4" />
                  שכחתי סיסמה / צריך עזרה
                </button>
              </div>
            )}

            {/* STEP: tenant login */}
            {step === 'tenant' && (
              <form onSubmit={handleTenantLogin} method="post" className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">כניסת דייר</h2>
                  <p className="text-sm text-slate-600 mt-1">הזינו את האימייל והסיסמה שנרשמתם איתם.</p>
                </div>

                <div>
                  <label htmlFor="tenant-email" className="block text-sm font-bold text-slate-700 mb-1.5">
                    כתובת דוא״ל
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
                      className="w-full text-base border border-slate-300 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
                    />
                    <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="tenant-password" className="block text-sm font-bold text-slate-700 mb-1.5">
                    סיסמה
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
                      className="w-full text-base border border-slate-300 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
                    />
                    <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {tenantError && (
                  <div role="alert" className="text-sm text-rose-700 bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{tenantError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={tenantBusy}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-base font-black shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
                >
                  <LogIn className="w-5 h-5" />
                  {tenantBusy ? 'מתחבר…' : 'כניסה לפורטל האישי'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('help'); setHelpSent(false); }}
                  className="w-full text-sm font-bold text-indigo-700 hover:text-indigo-900 min-h-[44px]"
                >
                  שכחתי סיסמה
                </button>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-950 leading-relaxed">
                  <span className="font-black block mb-1">דייר חדש בבניין?</span>
                  ההרשמה מתבצעת רק דרך קישור הזמנה אישי מוועד הבית.
                </div>
              </form>
            )}

            {/* STEP: admin login */}
            {step === 'admin' && (
              <form onSubmit={handleAdminLogin} method="post" className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">כניסת ועד הבית</h2>
                  <p className="text-sm text-slate-600 mt-1">מיועד לחברי הוועד בלבד.</p>
                </div>

                {(dataSource === 'supabase' && !configuredAdminEmail) && (
                  <div>
                    <label htmlFor="admin-email" className="block text-sm font-bold text-slate-700 mb-1.5">
                      דוא״ל ועד
                    </label>
                    <div className="relative">
                      <input
                        id="admin-email"
                        name="admin-email"
                        type="email"
                        autoComplete="username"
                        required
                        placeholder="avi@example.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full text-base border border-slate-300 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[48px]"
                      />
                      <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-bold text-slate-700 mb-1.5">
                    סיסמת ניהול
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      name="admin-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="הזינו סיסמת ועד"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full text-base border border-slate-300 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[48px]"
                    />
                    <ShieldCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {adminError && (
                  <div role="alert" className="text-sm text-rose-700 bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminBusy}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white text-base font-black shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
                >
                  <LogIn className="w-5 h-5" />
                  {adminBusy ? 'מתחבר…' : 'כניסה לדשבורד הניהול'}
                </button>
              </form>
            )}

            {/* STEP: help / password recovery guidance */}
            {step === 'help' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">עזרה ושחזור סיסמה</h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {dataSource === 'supabase'
                      ? 'נשלח קישור לאיפוס סיסמה לאימייל אם החשבון קיים. אם לא הגיע מייל — פנו לוועד הבית.'
                      : 'כרגע אין איפוס אוטומטי באתר. ועד הבית יכול לאפס את הרישום של הדירה או לשלוח קישור הזמנה מחדש.'}
                  </p>
                </div>

                {helpSent ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 leading-relaxed flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black mb-1">
                        {dataSource === 'supabase' ? 'אם החשבון קיים — נשלח מייל לאיפוס' : 'הבקשה נרשמה אצלכם במכשיר'}
                      </div>
                      פנו לוועד הבית עם כתובת האימייל של הדירה ובקשו איפוס סיסמה או קישור הזמנה חדש.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleHelpSubmit} method="post" className="space-y-4">
                    <div>
                      <label htmlFor="help-email" className="block text-sm font-bold text-slate-700 mb-1.5">
                        האימייל של הדירה
                      </label>
                      <input
                        id="help-email"
                        name="help-email"
                        type="email"
                        required
                        value={helpEmail}
                        onChange={(e) => setHelpEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full text-base border border-slate-300 rounded-xl py-3.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-black shadow-md flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      המשך לפנייה לוועד
                    </button>
                  </form>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  <span className="font-black block mb-1">איך פונים?</span>
                  פנו לוועד הבית (הידידות 5) בואטסאפ או בטלפון, וציינו את מספר הדירה ואת האימייל שאיתו נרשמתם.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Link, 
  Copy, 
  Check, 
  Send, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Phone,
  Building,
  Store,
  Sparkles,
  Megaphone,
  RotateCcw,
  Activity,
  Calendar,
  Eye,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';
import { InvitationToken } from '../../types';

export const TenantManagement: React.FC = () => {
  const { 
    properties, 
    users, 
    invitationTokens, 
    activityLogs,
    generateInviteToken, 
    revokeInviteToken, 
    resetApartmentRegistration,
    resetAllTenants,
    broadcastNotices, 
    publishBroadcastNotice, 
    deleteBroadcastNotice 
  } = useBuilding();

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeInviteDialog, setActiveInviteDialog] = useState<{ apartmentNumber: number; tokenUrl: string } | null>(null);

  // Broadcast Notice Form State
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'announcement' | 'maintenance' | 'urgent'>('announcement');
  const [isNoticePublished, setIsNoticePublished] = useState(false);

  const getApartmentStatus = (aptNum: number) => {
    if (aptNum === 2) {
      return {
        status: 'admin' as const,
        label: 'ועד הבית (מנהל)',
        badgeColor: 'bg-slate-900 text-white border-slate-700'
      };
    }

    // Only count as registered if user doesn't have a fake legacy mock email
    const registeredUser = users.find(u => 
      u.apartmentNumber === aptNum && 
      u.role === 'tenant' && 
      !u.email.includes('@heyedidut5.co.il')
    );

    if (registeredUser) {
      return {
        status: 'registered' as const,
        label: 'רשום ופעיל',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        user: registeredUser
      };
    }

    const pendingInvite = invitationTokens.find(t => t.apartmentNumber === aptNum && !t.isUsed);
    if (pendingInvite) {
      return {
        status: 'pending' as const,
        label: 'הזמנה ממתינה',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        invite: pendingInvite
      };
    }

    return {
      status: 'unassigned' as const,
      label: 'טרם נרשם',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  // Ensure invite URLs always point to production Vercel domain
  const getInviteUrl = (tokenString: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : 'https://heyedidut5.vercel.app';
    return `${origin}/?token=${tokenString}`;
  };

  const handleGenerateInvite = (aptNum: number) => {
    const newInvite = generateInviteToken(aptNum);
    const url = getInviteUrl(newInvite.token);
    setActiveInviteDialog({ apartmentNumber: aptNum, tokenUrl: url });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    publishBroadcastNotice({
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      author: 'אבי קוזי (ועד הבית)',
      category: noticeCategory
    });

    setNewNoticeTitle('');
    setNewNoticeContent('');
    setIsNoticePublished(true);
    setTimeout(() => setIsNoticePublished(false), 3000);
  };

  const registeredTenants = users.filter(u => u.role === 'tenant' && !u.email.includes('@heyedidut5.co.il'));
  const registeredTenantsCount = registeredTenants.length;
  const pendingInvitesCount = invitationTokens.filter(t => !t.isUsed).length;
  const totalLoginsCount = users.reduce((sum, u) => sum + (u.loginCount || 0), 0);

  return (
    <div className="space-y-6 mb-8 text-right font-hebrew">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              ניהול דיירים, הרשאות ומעקב פעילות (Audit & Stats)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              הפקת קישורי הזמנה אישיים, מעקב מי נרשם ומתי ביקר לאחרונה באתר
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('האם לאפס את כל ההזמנות והרישומים למצב נקי ("טרם נרשם")?')) {
                resetAllTenants();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
            title="איפוס כל הדיירים למצב טרם נרשם"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            איפוס נקי
          </button>
        </div>
      </div>

      {/* 2. Statistical KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">סה"כ נכסים בבניין</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            9 <span className="text-xs font-bold text-slate-400 font-normal">(7 דירות + 2 עסקים)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">דיירים רשומים בפועל</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 flex items-center gap-1.5">
            {registeredTenantsCount} <span className="text-xs font-bold text-slate-400">/ 8 יחידות</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">הזמנות בהמתנה</span>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            {pendingInvitesCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">סה"כ כניסות לאתר</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-500" />
            {totalLoginsCount}
          </div>
        </div>
      </div>

      {/* 3. Apartments Grid / Table with Last Active Column */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-600" />
            טבלת מעקב דיירים ופעילות לאחרונה
          </h3>
          <span className="text-[11px] text-slate-500">
            קישור קבוע: <code className="text-indigo-600 font-mono font-bold">heyedidut5.vercel.app</code>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {properties.map(prop => {
            const aptStatus = getApartmentStatus(prop.propertyNumber);
            const isSelf = prop.propertyNumber === 2; // Avi Admin

            return (
              <div 
                key={prop.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Unit Details */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${
                    isSelf ? 'bg-slate-900' : prop.type === 'commercial' ? 'bg-amber-600' : 'bg-indigo-600'
                  }`}>
                    {prop.propertyNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {prop.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${aptStatus.badgeColor}`}>
                        {isSelf ? 'ועד הבית (ניהול)' : aptStatus.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {prop.businessName ? `"${prop.businessName}" (${prop.residents})` : prop.residents}
                    </span>
                    {prop.recurringDayText && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        מועד חיוב קבוע: {prop.recurringDayText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Last Active Details */}
                <div className="flex-1 text-xs text-slate-600">
                  {isSelf && (
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                      מנהל המערכת (אבי) • גישה מלאה לכל הנתונים והדוחות
                    </span>
                  )}

                  {!isSelf && aptStatus.status === 'registered' && aptStatus.user && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-800 font-bold">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {aptStatus.user.email}
                        </span>
                        {aptStatus.user.phone && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {aptStatus.user.phone}
                          </span>
                        )}
                      </div>

                      {/* Last Active Timestamp & Visit Counter */}
                      <div className="flex items-center gap-3 text-[11px] flex-wrap">
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          פעילות אחרונה: {aptStatus.user.lastActive || aptStatus.user.lastLogin || 'היום'}
                        </span>
                        <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-indigo-600" />
                          {aptStatus.user.loginCount || 1} כניסות למערכת
                        </span>
                      </div>
                    </div>
                  )}

                  {!isSelf && aptStatus.status === 'pending' && aptStatus.invite && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-amber-800 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        הופק קישור הזמנה (בתוקף עד {aptStatus.invite.expiresAt})
                      </span>
                      <button
                        onClick={() => copyToClipboard(getInviteUrl(aptStatus.invite!.token), aptStatus.invite!.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] transition-all"
                      >
                        {copiedToken === aptStatus.invite.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            הקישור הועתק!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-amber-700" />
                            העתק קישור Vercel
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!isSelf && aptStatus.status === 'unassigned' && (
                    <span className="text-slate-400 text-xs">
                      הדייר טרם נרשם. לחץ "הפק קישור הזמנה" כדי לשלוח לו קישור אישי.
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {!isSelf && (
                    <>
                      <button
                        onClick={() => handleGenerateInvite(prop.propertyNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
                      >
                        <Link className="w-3.5 h-3.5" />
                        {aptStatus.status === 'registered' ? 'הפק קישור מחדש' : aptStatus.status === 'pending' ? 'הפק קישור חדש' : 'הפק קישור הזמנה'}
                      </button>

                      {aptStatus.status !== 'unassigned' && (
                        <button
                          onClick={() => {
                            if (confirm(`האם לאפס את הרישום/ההזמנה עבור ${prop.title}?`)) {
                              resetApartmentRegistration(prop.propertyNumber);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="איפוס ומחיקת רישום"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {isSelf && (
                    <span className="text-slate-400 font-bold text-xs px-3 py-1.5">
                      ועד הבית
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Generated Invite Dialog / Toast Modal */}
      {activeInviteDialog && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-black text-indigo-950">
                הופק קישור הזמנה ייעודי עבור {properties.find(p => p.propertyNumber === activeInviteDialog.apartmentNumber)?.title}!
              </h4>
            </div>
            <button
              onClick={() => setActiveInviteDialog(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              סגור
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            שלח קישור Vercel קבוע זה לדייר בוואטסאפ. הקישור פעיל 24/7 ואינו תלוי במחשב:
          </p>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-200">
            <input
              type="text"
              readOnly
              value={activeInviteDialog.tokenUrl}
              className="w-full text-xs font-mono text-indigo-900 bg-transparent outline-none select-all"
            />
            <button
              onClick={() => copyToClipboard(activeInviteDialog.tokenUrl, 'dialog')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              {copiedToken === 'dialog' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedToken === 'dialog' ? 'הועתק!' : 'העתק קישור'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Live Activity & Audit Trail (יומן פעילות וכניסות לאתר) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                יומן פעילות וכניסות דיירים לאתר בזמן אמת (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                מעקב אחרי כל פעולה, הרשמה או כניסה של דייר למערכת
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {activityLogs.length} אירועים מתועדים
          </span>
        </div>

        {activityLogs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">טרם תועדה פעילות.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    log.action === 'register' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} />
                  <div>
                    <span className="font-black text-slate-900">{log.userName}</span>
                    {log.apartmentNumber > 0 && (
                      <span className="text-slate-400 mr-1.5">(דירה {log.apartmentNumber})</span>
                    )}
                    <span className="text-slate-600 block text-[11px] mt-0.5">{log.details}</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Broadcast Notice Publisher */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                פרסום הודעת ועד ללוח הדיירים
              </h3>
              <p className="text-xs text-slate-500">
                הודעות שידור שיופיעו ישירות בפורטל האישי של כל דייר רשום
              </p>
            </div>
          </div>
        </div>

        {/* Publish Form */}
        <form onSubmit={handlePublishNotice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                כותרת ההודעה:
              </label>
              <input
                type="text"
                required
                placeholder="למשל: תזכורת בדיקת תקינות מעלית / עדכון ועד"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                קטגוריה:
              </label>
              <select
                value={noticeCategory}
                onChange={(e) => setNoticeCategory(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="announcement">הודעה כללית 📢</option>
                <option value="maintenance">תחזוקה ועבודות 🛠️</option>
                <option value="urgent">דחוף / בטיחות ⚠️</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              תוכן ההודעה לדיירים:
            </label>
            <textarea
              required
              rows={3}
              placeholder="כתוב כאן את פרטי ההודעה..."
              value={newNoticeContent}
              onChange={(e) => setNewNoticeContent(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              פרסם הודעה לפורטל הדיירים
            </button>

            {isNoticePublished && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ההודעה פורסמה בהצלחה!
              </span>
            )}
          </div>
        </form>

        {/* Existing Published Notices */}
        {broadcastNotices.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-black text-slate-700 block">
              הודעות פעילות כעת בפורטל הדיירים ({broadcastNotices.length}):
            </span>
            <div className="space-y-2">
              {broadcastNotices.map(notice => (
                <div 
                  key={notice.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{notice.title}</span>
                      <span className="text-[10px] text-slate-400">{notice.date}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteBroadcastNotice(notice.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="מחק הודעה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

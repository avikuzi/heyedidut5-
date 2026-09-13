import React, { useMemo } from 'react';
import { 
  Home, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  Bell, 
  ShieldCheck, 
  Clock, 
  Lock, 
  LogOut,
  Calendar,
  Sparkles,
  Megaphone,
  Check,
  Building
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';
import { formatCurrency } from '../../services/financialAnalytics';

export const PersonalTenantPortal: React.FC = () => {
  const { 
    currentUser, 
    properties, 
    transactions, 
    broadcastNotices, 
    logout 
  } = useBuilding();

  const aptNum = currentUser?.apartmentNumber || 1;
  const currentProp = properties.find(p => p.propertyNumber === aptNum) || properties[0];
  const isComm = currentProp.type === 'commercial';
  const hasDebt = currentProp.currentBalance < 0;

  // STRICT DATA PRIVACY: Only transactions linked to this specific apartment!
  const myLedgerTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.apartmentNumber === aptNum && 
      t.type === 'income'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, aptNum]);

  const totalPaidByMe = myLedgerTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 mb-8 text-right font-hebrew">
      
      {/* 1. Personalized Header & Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              {isComm ? <Store className="w-3.5 h-3.5 text-amber-400" /> : <Home className="w-3.5 h-3.5 text-emerald-400" />}
              <span>פורטל אישי מאובטח • הידידות 5, הוד השרון</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              שלום, {currentUser?.name || currentProp.residents}
            </h1>
            
            <p className="text-sm text-indigo-200 mt-1 font-medium">
              {currentProp.title} {currentProp.floor > 0 && `• קומה ${currentProp.floor}`}
              {currentProp.ownerName && ` • בעל הנכס: ${currentProp.ownerName}`}
            </p>

            {/* Payment Method Badge */}
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-white/15 text-indigo-100 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/10 font-bold">
                <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                אמצעי תשלום: {currentProp.paymentMethod}
              </span>

              <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-400/30 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                גישה פרטית מוגנת (Strict Data Privacy)
              </span>
            </div>
          </div>

          {/* Dues Status Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">יתרת חשבון נוכחית</span>
              {hasDebt ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-xs font-black border border-rose-400/40">
                  <AlertCircle className="w-3.5 h-3.5" /> דרושה הסדרה
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> החשבון מוסדר
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className={`text-2xl font-black ${hasDebt ? 'text-rose-300' : 'text-white'}`}>
                {hasDebt ? `${currentProp.currentBalance} ₪` : '0.00 ₪'}
              </div>
              
              <div className="text-xs text-slate-300 font-medium mt-1">
                {currentProp.balanceNote || 'כל התשלומים נקלטו במלואם'}
              </div>
              
              <div className="text-[11px] text-indigo-200 mt-1 pt-2 border-t border-white/10">
                דמי ועד שוטפים: {formatCurrency(currentProp.monthlyDue || (isComm ? 1000 : 270))} {isComm ? '/ שנתי' : '/ חודש'}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. My Ledger (החשבון והיסטוריית התשלומים שלי) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                החשבון האישי שלי (My Ledger)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                פירוט כל התשלומים והאסמכתאות שנקלטו מחשבונך בבנק לאורך שנת 2026
              </p>
            </div>
          </div>

          <div className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            סה"כ נקלט: {formatCurrency(totalPaidByMe)} ({myLedgerTransactions.length} תשלומים)
          </div>
        </div>

        {/* Ledger Table */}
        {myLedgerTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            טרם נקלטו תשלומים בבנק עבור דירה זו ברישום הנוכחי.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30 text-xs">
            {myLedgerTransactions.map((tx, idx) => (
              <div 
                key={tx.id || idx}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {tx.date}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-mono text-slate-600 font-bold">אסמכתא: {tx.reference}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">נקלט בחשבון הבנק ✅</span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="font-black text-emerald-700 text-sm block">
                    +{formatCurrency(tx.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    הכנסה מאושרת
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Notice Board (הודעות ועד ושידור לקהילה) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              לוח מודעות והודעות ועד (Notice Board)
            </h3>
            <p className="text-xs text-slate-500">
              הודעות שידור ישירות מוועד הבית (אבי) לכלל דיירי הבניין
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {broadcastNotices.map((notice) => (
            <div 
              key={notice.id}
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/20 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h4 className="text-sm font-black text-slate-900">
                    {notice.title}
                  </h4>
                </div>
                <span className="text-[11px] text-indigo-700 font-bold">
                  {notice.date}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {notice.content}
              </p>

              <div className="text-[11px] text-slate-400 font-medium pt-1">
                מאת: {notice.author}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Data Security Guarantee */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="leading-relaxed">
          <strong>אבטחת מידע ופרטיות:</strong> פורטל זה מציג אך ורק את הנתונים והחיובים המשויכים לדירתך. נתוני התשלומים של דיירים אחרים והתקציב הגלובלי של הוועד שמורים במערכת הניהול המאובטחת בלבד.
        </p>
      </div>

    </div>
  );
};

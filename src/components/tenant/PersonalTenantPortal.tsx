import React, { useMemo, useState } from 'react';
import { 
  Home, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Megaphone,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';
import { formatCurrency } from '../../services/financialAnalytics';

export const PersonalTenantPortal: React.FC = () => {
  const { 
    currentUser, 
    properties, 
    transactions, 
    broadcastNotices
  } = useBuilding();

  const [showLedger, setShowLedger] = useState(false);

  const aptNum = currentUser?.apartmentNumber || 1;
  const currentProp = properties.find(p => p.propertyNumber === aptNum) || properties[0];
  const isComm = currentProp.type === 'commercial';
  const hasDebt = currentProp.currentBalance < 0;

  const myLedgerTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.apartmentNumber === aptNum && 
      t.type === 'income'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, aptNum]);

  const totalPaidByMe = myLedgerTransactions.reduce((sum, t) => sum + t.amount, 0);
  const recentNotices = (broadcastNotices || []).slice(0, 3);
  const monthlyDue = currentProp.monthlyDue || (isComm ? 1000 : 270);

  return (
    <div className="space-y-5 mb-8 text-right font-hebrew max-w-3xl mx-auto">
      
      {/* Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold border border-white/10 mb-3">
          {isComm ? <Store className="w-4 h-4 text-amber-400" /> : <Home className="w-4 h-4 text-emerald-400" />}
          <span>הידידות 5 · הוד השרון</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          שלום, {currentUser?.name || currentProp.residents}
        </h1>
        
        <p className="text-sm sm:text-base text-indigo-200 mt-1.5 font-medium">
          {currentProp.title}
          {currentProp.floor > 0 && ` · קומה ${currentProp.floor}`}
        </p>
      </div>

      {/* Balance + primary action */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-500">יתרת החשבון שלי</div>
            <div className={`text-3xl sm:text-4xl font-black mt-1 ${hasDebt ? 'text-rose-600' : 'text-emerald-700'}`}>
              {hasDebt ? `${currentProp.currentBalance} ₪` : '0 ₪'}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {currentProp.balanceNote || (hasDebt ? 'יש יתרת חוב להסדרה' : 'החשבון מוסדר')}
            </div>
          </div>
          {hasDebt ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-sm font-black border border-rose-200">
              <AlertCircle className="w-4 h-4" /> דרושה הסדרה
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-black border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> מוסדר
            </span>
          )}
        </div>

        <div className="text-sm text-slate-600 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
          דמי ועד שוטפים: <strong>{formatCurrency(monthlyDue)}</strong>
          {isComm ? ' / שנתי' : ' / חודש'}
          <span className="mx-2 text-slate-300">·</span>
          אמצעי תשלום: <strong>{currentProp.paymentMethod}</strong>
        </div>

        {hasDebt ? (
          <a
            href="#payment-help"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-black shadow-md min-h-[48px]"
          >
            <CreditCard className="w-5 h-5" />
            איך מסדירים את התשלום?
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setShowLedger(true)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-base font-black shadow-md min-h-[48px]"
          >
            <FileText className="w-5 h-5" />
            צפייה בהיסטוריית התשלומים
          </button>
        )}
      </div>

      {/* Payment help (primary action target when in debt) */}
      {hasDebt && (
        <div id="payment-help" className="bg-indigo-50 rounded-3xl border border-indigo-100 p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            הסדרת תשלום
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            שלמו לפי אמצעי התשלום הרשום לדירה: <strong>{currentProp.paymentMethod}</strong>.
            אחרי ההעברה, עדכנו את ועד הבית כדי שהתשלום יייקלט בפורטל.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            אם משהו לא ברור — פנו לוועד הבית עם מספר הדירה וסכום התשלום.
          </p>
        </div>
      )}

      {/* Notices — top 3 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">הודעות ועד</h2>
            <p className="text-sm text-slate-500">3 ההודעות האחרונות</p>
          </div>
        </div>

        <div className="space-y-3">
          {recentNotices.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-500">
              אין הודעות כרגע.
            </div>
          ) : (
            recentNotices.map((notice) => (
              <div 
                key={notice.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    {notice.title}
                  </h3>
                  <span className="text-xs sm:text-sm text-indigo-700 font-bold shrink-0">
                    {notice.date}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {notice.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collapsible ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLedger(v => !v)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-right min-h-[56px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">היסטוריית תשלומים</div>
              <div className="text-sm text-slate-500">
                סה״כ נקלט: {formatCurrency(totalPaidByMe)} · {myLedgerTransactions.length} תשלומים
              </div>
            </div>
          </div>
          {showLedger ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {showLedger && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            {myLedgerTransactions.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-500">
                טרם נקלטו תשלומים עבור דירה זו.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {myLedgerTransactions.map((tx, idx) => (
                  <div 
                    key={tx.id || idx}
                    className="p-4 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-black text-slate-800 text-sm sm:text-base truncate">
                        {tx.description}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">
                        {tx.date}
                        {tx.reference ? ` · אסמכתא ${tx.reference}` : ''}
                      </div>
                    </div>
                    <div className="text-left shrink-0 font-black text-emerald-700 text-sm sm:text-base">
                      +{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>פרטיות:</strong> הפורטל מציג רק את הנתונים של הדירה שלכם. נתוני דיירים אחרים אינם נגישים כאן.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Lock className="w-3.5 h-3.5" />
        גישה אישית לדירה {aptNum}
      </div>
    </div>
  );
};

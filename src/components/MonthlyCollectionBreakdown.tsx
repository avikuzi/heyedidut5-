import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Copy, 
  Check, 
  CreditCard,
  Building,
  Store,
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../services/financialAnalytics';

export const MonthlyCollectionBreakdown: React.FC = () => {
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // 6 Incoming deposits recorded in August 2026 bank statement (total 1,705.00 NIS)
  const paidDetails = [
    {
      propertyNumber: 1,
      title: 'דירה 1',
      residents: 'עופר ודליה מי-טל',
      amount: 270.00,
      date: '05/08/2026',
      reference: '99046',
      method: 'העברה בנקאית (בנק מסד)',
      sourceText: 'ה מבנק מסד ס-י'
    },
    {
      propertyNumber: 4,
      title: 'דירה 4',
      residents: 'פרי ודורית ארנפלד',
      amount: 270.00,
      date: '07/08/2026',
      reference: '93650',
      method: 'העברה בנקאית (דיגיטל)',
      sourceText: 'העברה דיגיטל'
    },
    {
      propertyNumber: 7,
      title: 'דירה 7 (פנטהאוז)',
      residents: 'צחי ועיינה (דירה וחצי)',
      amount: 375.00,
      date: '10/08/2026',
      reference: '99014',
      method: 'העברה בנקאית (אוצר החיל)',
      sourceText: 'בנק אוצר החיל',
      note: 'הועברו 375 ₪ (תעריף מעודכן 405 ₪)'
    },
    {
      propertyNumber: 2,
      title: 'דירה 2',
      residents: 'אבי קוזי (ועד הבית)',
      amount: 270.00,
      date: '10/08/2026',
      reference: '4960395',
      method: 'העברה בנקאית (הוראת קבע)',
      sourceText: 'הוראת קבע'
    },
    {
      propertyNumber: 6,
      title: 'דירה 6',
      residents: 'גולן שרון ומשפחתו',
      amount: 270.00,
      date: '18/08/2026',
      reference: '5025753',
      method: 'העברה בנקאית (הוראת קבע)',
      sourceText: 'הוראת קבע'
    },
    {
      propertyNumber: 5,
      title: 'דירה 5',
      residents: 'אילנה',
      amount: 250.00,
      date: '20/08/2026',
      reference: '4871740',
      method: 'העברה בנקאית (הוראת קבע)',
      sourceText: 'הוראת קבע',
      note: 'הועברו 250 ₪ (תעריף מעודכן 270 ₪)'
    }
  ];

  // Commercial Assets: Paid 1,000 NIS each annual fee in advance
  const commercialPaid = [
    {
      propertyNumber: 8,
      title: 'נכס 8',
      businessName: 'סופר הכיכר',
      residents: 'הנהלת סופר הכיכר (מכולת)',
      amount: 1000.00,
      reference: '151284',
      method: 'צ\'ק שנתי',
      status: 'שולם 1,000 ₪ שנתי מראש בצ\'ק ✅'
    },
    {
      propertyNumber: 9,
      title: 'נכס 9',
      businessName: 'מאפיית לחם בכפר',
      residents: 'הנהלת מאפיית לחם בכפר (מאפייה)',
      amount: 1000.00,
      reference: '14958',
      method: 'צ\'ק שנתי',
      status: 'שולם 1,000 ₪ שנתי מראש בצ\'ק ✅'
    }
  ];

  // Pending dues & retro shortfalls to complete
  const pendingDetails = [
    {
      propertyNumber: 7,
      title: 'דירה 7 (פנטהאוז)',
      residents: 'צחי ועיינה (דירה וחצי)',
      amount: 180.00,
      method: 'העברה בנקאית (אוצר החיל)',
      statusNote: 'הפרש רטרו ממרץ: 180 ₪ (30 ₪ × 6 חודשים) • תעריף 405 ₪'
    },
    {
      propertyNumber: 5,
      title: 'דירה 5',
      residents: 'אילנה',
      amount: 120.00,
      method: 'העברה בנקאית (הוראת קבע)',
      statusNote: 'הפרש רטרו ממרץ: 120 ₪ (20 ₪ × 6 חודשים) • תעריף 270 ₪'
    },
    {
      propertyNumber: 3,
      title: 'דירה 3',
      residents: 'אמיר ומירי חנוכה (שוכרים) | יניב',
      amount: 540.00,
      method: 'מזומן / אפליקציה לאבי הוועד',
      statusNote: 'חוב עבור חודשים יולי ואוגוסט 2026 (540- ₪)'
    }
  ];

  const totalCollectedAugust = paidDetails.reduce((sum, p) => sum + p.amount, 0);

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 mb-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              פירוט גבייה ואסמכתאות בנקאיות (אוגוסט 2026)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              סנכרון מול דף חשבון הבנק • אמצעי תשלום, אסמכתאות ויתרות
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-black text-emerald-800">
            נקלט באוגוסט: {formatCurrency(totalCollectedAugust)}
          </div>
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-black text-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            חובות ורטרו: -840.00 ₪
          </div>
        </div>
      </div>

      {/* Grid: Paid in August + Commercial & Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. Paid Deposits in August (7 Cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <h3 className="text-xs sm:text-sm font-black text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            תשלומים שנקלטו בבנק באוגוסט (6 נכסים • 1,705 ₪)
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30 text-xs">
            {paidDetails.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-white font-black text-[11px] flex items-center justify-center">
                      {item.propertyNumber}
                    </span>
                    <span className="font-black text-slate-800">
                      {item.title} • {item.residents}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">{item.method}</span>
                    {item.note && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">{item.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-black text-emerald-700 text-sm">
                    +{formatCurrency(item.amount)}
                  </div>
                  <button
                    onClick={() => copyReference(item.reference)}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors pt-0.5 font-mono"
                    title="העתק אסמכתא"
                  >
                    אסמכתא: {item.reference}
                    {copiedRef === item.reference ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Annual Businesses + Pending (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Commercial Assets Settled */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600" />
              עסקים מסחריים (מוסדר לשנה מראש)
            </h3>
            
            <div className="space-y-2">
              {commercialPaid.map((comm, idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-amber-200 bg-amber-50/40 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-black text-amber-950 block">
                      "{comm.businessName}" ({comm.residents})
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      צ'ק 1,000 ₪ נפרע בבנק • אסמכתא: {comm.reference}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    מוסדר ✅
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Dues & Shortfalls */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-black text-rose-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              חובות שוטפים והפרשי רטרו
            </h3>

            <div className="space-y-2">
              {pendingDetails.map((pend, idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-rose-200 bg-rose-50/40 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 block">
                      {pend.title} • {pend.residents}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      {pend.statusNote}
                    </span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-rose-700 text-sm block">
                      -{formatCurrency(pend.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {pend.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

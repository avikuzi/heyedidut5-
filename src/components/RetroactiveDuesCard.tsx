import React from 'react';
import { 
  TrendingUp, 
  Info, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../services/financialAnalytics';

export const RetroactiveDuesCard: React.FC = () => {
  const retroCases = [
    {
      propertyNumber: 7,
      title: 'דירה 7 (פנטהאוז)',
      residents: 'צחי ועיינה',
      tag: 'דירה וחצי (פנטהאוז + יחידת דיור)',
      reason: 'עדכון תעריף ל-405 ₪ (+30 ₪ לדירה וחצי).',
      monthsCount: 6,
      monthlyShortfall: 30,
      totalDue: 0,
      originalDue: 180,
      isPaid: true,
      paidDate: '30/08/2026',
      actionRequired: 'הפרש הרטרו בסך 180 ₪ שולם והוסדר במלואו ב-30/08/2026! (יש לוודא עדכון הוראת הקבע השוטפת ל-405 ₪ החל מספטמבר).'
    },
    {
      propertyNumber: 5,
      title: 'דירה 5',
      residents: 'אילנה',
      tag: 'דירת מגורים (הוראת קבע)',
      reason: 'עדכון תעריף מ-1.3 ל-270 ₪ (ביטוח מורחב). הוראת הקבע המשיכה להעביר 250 ₪ לחודש.',
      monthsCount: 6,
      monthlyShortfall: 20,
      totalDue: 120,
      originalDue: 120,
      isPaid: false,
      actionRequired: 'עדכון הוראת הקבע ל-270 ₪ + השלמת הפרש רטרו של 120 ₪ (20 ₪ × 6 חודשים: מרץ–אוגוסט).'
    },
    {
      propertyNumber: 3,
      title: 'דירה 3',
      residents: 'אמיר ומירי חנוכה | יניב',
      tag: 'דיירים שוכרים (חוב שוטף)',
      reason: 'טרם נקלטו תשלומים לחודשים יולי ואוגוסט 2026 (270 ₪ לחודש).',
      monthsCount: 2,
      monthlyShortfall: 270,
      totalDue: 540,
      originalDue: 540,
      isPaid: false,
      actionRequired: 'הסדרת תשלום דמי ועד עבור יולי ואוגוסט בסך 540 ₪ (270 ₪ × 2).'
    }
  ];

  const totalRetroAmount = retroCases.reduce((sum, item) => sum + (item.isPaid ? 0 : item.totalDue), 0);

  return (
    <div className="bg-white rounded-3xl border border-amber-200 shadow-xs overflow-hidden mb-6">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-amber-50/70 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              הודעת ועד: השלמת הפרשי דמי ועד רטרואקטיבית (החל ממרץ 2026)
            </h2>
            <p className="text-xs text-slate-600">
              עדכון תעריפים מפוליסת הביטוח: +20 ₪ לדירה (270 ₪), +30 ₪ לפנטהאוז (405 ₪ עקב דירה וחצי)
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-950 flex items-center gap-2 self-start sm:self-auto">
          <span>נותר להסדרה:</span>
          <span className="text-sm font-black text-rose-700">{formatCurrency(totalRetroAmount)}</span>
        </div>
      </div>

      {/* Clean Table */}
      <div className="divide-y divide-slate-100">
        {retroCases.map((item, idx) => (
          <div 
            key={idx}
            className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.isPaid ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-slate-50/70'
            }`}
          >
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`w-6 h-6 rounded-md font-black text-xs flex items-center justify-center ${
                  item.isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                  {item.propertyNumber}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {item.title} • {item.residents}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {item.tag}
                </span>
                {item.isPaid && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    הוסדר ושולם ב-30/08/2026
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600">
                {item.reason}
              </p>
              <p className={`text-xs font-semibold ${item.isPaid ? 'text-emerald-800' : 'text-amber-900'}`}>
                {item.isPaid ? '✓' : '📌'} <strong>{item.isPaid ? 'סטטוס:' : 'נדרש:'}</strong> {item.actionRequired}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 block font-medium">
                {item.isPaid ? 'יתרת חוב:' : 'סכום לתשלום:'}
              </span>
              <div className={`text-lg font-black ${item.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.isPaid ? '₪0.00' : `-${formatCurrency(item.totalDue)}`}
              </div>
              <span className="text-[10px] text-slate-500">
                {item.isPaid 
                  ? `הועברו 180 ₪ (30 ₪ × 6 חודשים)` 
                  : `${item.monthsCount} חודשים × ${formatCurrency(item.monthlyShortfall)}`}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

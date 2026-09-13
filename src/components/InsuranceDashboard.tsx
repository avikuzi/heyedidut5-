import React from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Droplets, 
  Activity, 
  Users2, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../services/financialAnalytics';

export const InsuranceDashboard: React.FC = () => {
  const policyCovers = [
    {
      title: 'ביטוח מבנה מלא (אש וסערה)',
      desc: 'כיסוי מקיף לנזקי שריפה, מזג אוויר סוער ופגיעות מבניות ברכוש המשותף.',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      status: 'פעיל ומבוטח ✅'
    },
    {
      title: 'כיסוי נזקי צנרת ומים',
      desc: 'כיסוי מלא לנזקי התבקעות צנרת משותפת, דליפות מים ונזקים עקיפים.',
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      status: 'פעיל ומבוטח ✅'
    },
    {
      title: 'כיסוי רעידת אדמה',
      desc: 'הגנה מלאה מפני נזקי טבע ורעידות אדמה לכל חלקי המבנה המשותף.',
      icon: <Activity className="w-5 h-5 text-rose-500" />,
      status: 'פעיל ומבוטח ✅'
    },
    {
      title: 'חבות צד ג\' וחבות מעבידים',
      desc: 'כיסוי אחריות משפטית כלפי מבקרים, עוברי אורח ועובדי תחזוקה/ניקיון.',
      icon: <Users2 className="w-5 h-5 text-indigo-500" />,
      status: 'פעיל ומבוטח ✅'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 mb-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                פוליסת ביטוח המבנה והרכוש המשותף
              </h2>
              <span className="px-2 py-0.5 rounded-md text-xs font-black bg-indigo-600 text-white">
                אופציה 3 • מורחבת
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              פוליסה פעילה מ-1.3 המכסה את כל 9 הנכסים בבניין (7 דירות ו-2 עסקים)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <Calendar className="w-3.5 h-3.5" />
          בתוקף מ-01/03/2026
        </div>
      </div>

      {/* 4 Coverages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policyCovers.map((cover, idx) => (
          <div 
            key={idx}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
              {cover.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  {cover.title}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full shrink-0">
                  פעיל ✅
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {cover.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Context Box */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-white rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-900">עלות הפוליסה הכוללת:</span>
            <span className="text-base font-black text-indigo-700">3,365 ₪ / לשנה</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            ההשקעה מייצגת תוספת של <strong>כ-20 ₪ לחודש לדירה בלבד</strong> (משוקלל בתוך דמי הועד המעודכנים של 270 ₪) ומעניקה שקט נפשי והגנה משפטית וביטוחית מלאה.
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            כיסוי מלא ל-9 נכסים
          </span>
        </div>
      </div>

    </div>
  );
};

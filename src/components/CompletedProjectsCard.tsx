import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Copy, 
  Check, 
  ShieldCheck, 
  Building, 
  Info,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { formatCurrency } from '../services/financialAnalytics';

export const CompletedProjectsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden mb-8">
      
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                שקיפות פיננסית ופרויקטים
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% הושלם בהצלחה
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              דוח פרויקטים מיוחדים, גבייה ייעודית וסגירת גירעונות
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>100% גבייה הושלמה בהצלחה (9/9 נכסים שילמו) ✅</span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        
        {/* Project Milestone Summary */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-50/70 via-slate-50/50 to-teal-50/30 border border-emerald-200/80">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                פרויקט חירום שהושלם במלואו
              </span>
              <h3 className="text-base font-black text-slate-900">
                תיקון פיצוץ צנרת וכיסוי גירעון
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
                בעקבות פיצוץ בצנרת המשותפת שעלות תיקונו הסתכמה ב-5,600 ₪, בוצעה גבייה מיוחדת וחד-פעמית של 450 ₪ מכל נכס משתתף. הגבייה הושלמה בהצלחה וכל החובות לבעלי המקצוע שולמו במלואם.
              </p>
            </div>

            {/* Financial Badge */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs shrink-0 text-center md:text-left min-w-[200px]">
              <span className="text-[11px] text-slate-400 font-bold block">עלות כוללת וגבייה:</span>
              <div className="text-xl font-black text-emerald-800 mt-0.5">
                5,600 ₪
              </div>
              <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                450 ₪ מכל נכס משתתף • שולם 9 מתוך 9
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 pt-4 border-t border-emerald-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>התקדמות גביית הפרויקט:</span>
              <span className="text-emerald-700 font-black">100% (9 מתוך 9 נכסים)</span>
            </div>
            <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full transition-all"></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

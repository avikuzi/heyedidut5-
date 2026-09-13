import React from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCheck, 
  HelpCircle,
  Zap,
  ArrowUpDown,
  Trees,
  Sparkles,
  Droplets,
  BellRing
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { ExpenseCategory } from '../types';
import { formatCurrency } from '../services/financialAnalytics';

export const AlertDashboard: React.FC = () => {
  const { 
    anomalies, 
    acknowledgeAnomaly, 
    role 
  } = useBuilding();

  const activeAnomalies = anomalies.filter(a => !a.isAcknowledged);

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'electricity': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'elevator': return <ArrowUpDown className="w-5 h-5 text-indigo-500" />;
      case 'gardening': return <Trees className="w-5 h-5 text-emerald-500" />;
      case 'cleaning': return <Sparkles className="w-5 h-5 text-cyan-500" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  if (activeAnomalies.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            התראות חריגה כספיות פעילות
          </h2>
        </div>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
          {activeAnomalies.length} חריגות תקציב זוהו
        </span>
      </div>

      {/* Financial Anomaly Alert Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeAnomalies.map((anomaly) => (
          <div 
            key={anomaly.id}
            className="bg-gradient-to-br from-rose-50 via-white to-amber-50/40 border-2 border-rose-300/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden anomaly-pulse"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 shadow-xs flex items-center justify-center">
                  {getCategoryIcon(anomaly.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
                      חריגה של {anomaly.percentageIncrease}%+
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{anomaly.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    זינוק בהוצאות {anomaly.categoryNameHe}
                  </h3>
                </div>
              </div>

              {role === 'admin' && (
                <button
                  onClick={() => acknowledgeAnomaly(anomaly.id)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs"
                  title="סמן שנבדק"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  סמן כנבדק
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              {anomaly.description}
            </p>

            <div className="grid grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100 text-xs">
              <div className="text-center">
                <span className="text-slate-400 block text-[11px]">סכום ששולם</span>
                <span className="font-extrabold text-rose-700 text-sm">
                  {formatCurrency(anomaly.amount)}
                </span>
              </div>
              <div className="text-center border-r border-slate-200">
                <span className="text-slate-400 block text-[11px]">ממוצע 3 חודשים</span>
                <span className="font-bold text-slate-700 text-sm">
                  {formatCurrency(anomaly.trailing3MonthAvg)}
                </span>
              </div>
              <div className="text-center border-r border-slate-200">
                <span className="text-slate-400 block text-[11px]">תוספת חריגה</span>
                <span className="font-extrabold text-rose-600 text-sm flex items-center justify-center gap-0.5">
                  <TrendingUp className="w-3 h-3 inline" />
                  +{formatCurrency(anomaly.amount - anomaly.trailing3MonthAvg)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>הסבר: בדיקת חיובים חריגים או הוצאה תקופתית חד פעמית.</span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

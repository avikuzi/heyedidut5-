import React from 'react';
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { formatCurrency } from '../services/financialAnalytics';

export const KpiHeader: React.FC = () => {
  const { stats } = useBuilding();

  const isPositiveCashFlow = stats.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Current Balance */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              יתרה נוכחית בחשבון
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(stats.currentBalance)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1 font-black ${isPositiveCashFlow ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositiveCashFlow ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>תזרים נטו: {formatCurrency(stats.netCashFlow)}</span>
          </div>
          <span className="text-slate-400 font-medium">לפי דף החשבון</span>
        </div>
      </div>

      {/* 2. Monthly Spend */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              הוצאות החודש
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">תקציב יעד: {formatCurrency(stats.monthlyBudget)}</span>
          <span className={`font-bold ${stats.monthlyExpenses > stats.monthlyBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {Math.round((stats.monthlyExpenses / (stats.monthlyBudget || 1)) * 100)}% נוצל
          </span>
        </div>
      </div>

      {/* 3. Monthly Income */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              הכנסות החודש (גבייה)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(stats.monthlyIncome)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{stats.paidPropertiesCount} מתוך {stats.totalProperties} מוסדרים במלואם</span>
          </div>
          <span className="font-black text-emerald-600">{stats.collectionRate}%</span>
        </div>
      </div>

      {/* 4. Outstanding Dues */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              חובות פתוחים והפרשי רטרו
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {formatCurrency(stats.outstandingDues)}
            </div>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            stats.outstandingDues > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            3 נכסים (חוב שוטף + רטרו ממרץ)
          </span>
          <span className="font-bold text-rose-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> דרוש מעקב
          </span>
        </div>
      </div>

    </div>
  );
};

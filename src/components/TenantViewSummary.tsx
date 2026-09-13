import React from 'react';
import { 
  Home, 
  Store,
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Download, 
  ShieldCheck, 
  Sparkles,
  Info,
  Clock,
  Wallet
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { formatCurrency, getCategoryBreakdown } from '../services/financialAnalytics';

export const TenantViewSummary: React.FC = () => {
  const { selectedProperty, properties, stats, transactions, activeMonth } = useBuilding();

  const currentProp = properties.find(p => p.propertyNumber === selectedProperty) || properties[0];
  const isPaid = currentProp.isPaidCurrentMonth;
  const isComm = currentProp.type === 'commercial';
  const isPenthouse = currentProp.propertyNumber === 7;
  const hasDebt = currentProp.currentBalance < 0;
  const categoryBreakdown = getCategoryBreakdown(transactions, activeMonth);

  return (
    <div className="space-y-6 mb-8">
      
      {/* 1. Personal Welcome & Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-3">
              {isComm ? <Store className="w-3.5 h-3.5 text-amber-400" /> : <Home className="w-3.5 h-3.5 text-emerald-400" />}
              <span>פורטל דיירים ועסקים • הידידות 5, הוד השרון</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              שלום, {currentProp.businessName ? `"${currentProp.businessName}"` : currentProp.residents}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 font-medium">
              {currentProp.title} • קומה {currentProp.floor} 
              {currentProp.ownerName && ` • בעל הנכס: ${currentProp.ownerName}`}
            </p>

            {/* Payment Method Badge */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-white/15 text-indigo-100 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/10 font-bold">
                <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                אמצעי תשלום: {currentProp.paymentMethod}
              </span>
              {isPenthouse && (
                <span className="text-amber-300 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-400/30 font-bold">
                  ✨ כולל יחידת דיור פנימית (תעריף מותאם יחסי)
                </span>
              )}
            </div>
          </div>

          {/* Dues Status Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-bold">יתרת חשבון נוכחית</span>
              {hasDebt ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-200 text-xs font-black border border-rose-400/40">
                  <AlertCircle className="w-3.5 h-3.5" /> יתרת חוב
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> מוסדר במלואו
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className={`text-2xl font-black ${hasDebt ? 'text-rose-300' : 'text-white'}`}>
                {hasDebt ? `${currentProp.currentBalance} ₪` : '0.00 ₪'}
                <span className="text-xs font-normal text-indigo-200">
                  {hasDebt ? ' (יולי + אוגוסט)' : ' (החשבון מעודכן)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium mt-1">
                דמי ועד שוטפים: {formatCurrency(currentProp.monthlyDue || (isComm ? 1000 : 270))} {isComm ? '/ שנה' : '/ חודש'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-indigo-200">
                גבייה מיוחדת צנרת (450 ₪):
              </span>
              <span className="text-emerald-300 font-bold">
                שולם במלואו ✅
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Building Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">קופת ועד הבית (יתרה נוכחית)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.currentBalance)}
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> מאזן חיובי מסונכרן לבנק
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">הוצאות הבניין החודש</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.monthlyExpenses)}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            חשמל, כפיר מעליות, ניקיון וביטוח
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">סטטוס פרויקט צנרת</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            הושלם (100%)
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            כל 9 הנכסים שילמו וחובות כוסו במלואם
          </p>
        </div>

      </div>

      {/* 3. Transparent Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-black text-slate-900 mb-1">
          לאן הולכים דמי הועד? • שקיפות הוצאות שוטפות
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          פירוט השירותים, התחזוקה ופוליסת הביטוח הממומנים על ידי דמי הועד (270 ₪ לחודש)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryBreakdown.map(item => (
            <div 
              key={item.category}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{item.nameHe}</span>
                  <span className="text-[11px] text-slate-400">{item.count} תשלומים</span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-900 block">{formatCurrency(item.amount)}</span>
                <span className="text-[10px] font-bold text-slate-500">{item.percentage}% מסך ההוצאות</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

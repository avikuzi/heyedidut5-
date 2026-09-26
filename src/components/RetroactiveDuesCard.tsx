import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { debtMonthsLine, openDebtProperties, outstandingDebtTotal } from '../lib/debtDisplay';
import { formatCurrency } from '../services/financialAnalytics';

export const RetroactiveDuesCard: React.FC = () => {
  const { properties } = useBuilding();
  const debtors = useMemo(() => openDebtProperties(properties), [properties]);
  const totalDue = useMemo(() => outstandingDebtTotal(properties), [properties]);

  return (
    <div className="bg-white rounded-3xl border border-amber-200 shadow-xs overflow-hidden mb-6">
      <div className="p-4 sm:p-5 bg-amber-50/70 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              חובות פתוחים והפרשי רטרו
            </h2>
            <p className="text-xs text-slate-600">
              לפי יתרת הנכס, הערת היתרה ודמי הוועד החודשיים
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-950 flex items-center gap-2 self-start sm:self-auto">
          <span>נותר להסדרה:</span>
          <span className="text-sm font-black text-rose-700">{formatCurrency(totalDue)}</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {debtors.length === 0 ? (
          <p className="p-4 sm:p-5 text-sm text-slate-600">אין חובות פתוחים לפי יתרות הנכסים.</p>
        ) : (
          debtors.map((property) => {
            const shortfall = Number(property.retroactiveShortfall ?? 0);
            const monthsLine = debtMonthsLine(property);
            const shortfallDiffers =
              shortfall > 0 &&
              Math.abs(shortfall - Math.abs(property.currentBalance)) > 0.009;

            return (
              <div
                key={property.id}
                className="p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-md font-black text-xs flex items-center justify-center bg-slate-900 text-white">
                      {property.propertyNumber}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {property.title} • {property.residents}
                      {property.ownerName ? ` | ${property.ownerName}` : ''}
                    </span>
                    {property.paymentMethod && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {property.paymentMethod}
                      </span>
                    )}
                    {shortfall > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        הפרש רטרואקטיבי
                      </span>
                    )}
                  </div>

                  {property.balanceNote && (
                    <p className="text-xs text-slate-600">{property.balanceNote}</p>
                  )}
                  {shortfallDiffers && (
                    <p className="text-xs font-semibold text-amber-900">
                      הפרש רטרואקטיבי: {formatCurrency(shortfall)}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">סכום לתשלום:</span>
                  <div className="text-lg font-black text-rose-600">
                    -{formatCurrency(Math.abs(property.currentBalance))}
                  </div>
                  {monthsLine && (
                    <span className="text-[10px] text-slate-500">{monthsLine}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

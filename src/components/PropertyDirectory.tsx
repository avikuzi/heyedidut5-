import React, { useState } from 'react';
import { 
  Building, 
  Store, 
  Home, 
  Check, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  CreditCard,
  UserCheck,
  Clock
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { PropertyResident } from '../types';

interface PropertyDirectoryProps {
  onOpenHazardModal?: () => void;
}

export const PropertyDirectory: React.FC<PropertyDirectoryProps> = ({ onOpenHazardModal }) => {
  const { properties } = useBuilding();
  const [filterType, setFilterType] = useState<'all' | 'residential' | 'commercial'>('all');
  const [search, setSearch] = useState('');

  const filteredProperties = properties.filter(p => {
    if (filterType === 'residential' && p.type !== 'residential') return false;
    if (filterType === 'commercial' && p.type !== 'commercial') return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.residents.toLowerCase().includes(q) || 
           (p.businessName && p.businessName.toLowerCase().includes(q)) || 
           (p.ownerName && p.ownerName.toLowerCase().includes(q)) ||
           p.title.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      
      {/* Header & Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                ספר נכסים ודיירים • הידידות 5
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                7 דירות מגורים ו-2 נכסים מסחריים • מעקב תשלומים ויתרות חשבון
              </p>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="חיפוש לפי דירה או שם..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs pr-8 pl-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52"
              />
            </div>

            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                הכל ({properties.length})
              </button>
              <button
                onClick={() => setFilterType('residential')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'residential' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                מגורים (7)
              </button>
              <button
                onClick={() => setFilterType('commercial')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'commercial' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                עסקים (2)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map((prop) => {
          const isCommercial = prop.type === 'commercial';
          const hasDebt = prop.currentBalance < 0;

          return (
            <div
              key={prop.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                hasDebt 
                  ? 'bg-rose-50/25 border-rose-200 hover:border-rose-300' 
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top Row: Unit & Role */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${isCommercial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {isCommercial ? <Store className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {prop.title}
                    </span>
                    {prop.floor > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        קומה {prop.floor}
                      </span>
                    )}
                  </div>

                  {prop.residentRole === 'admin' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ועד הבית
                    </span>
                  )}
                  {prop.residentRole === 'tenant' && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                      שוכרים
                    </span>
                  )}
                  {isCommercial && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                      מסחרי
                    </span>
                  )}
                </div>

                {/* Resident / Business Name */}
                <div className="mt-2.5 mb-2">
                  <div className="text-sm font-black text-slate-800">
                    {prop.businessName ? `"${prop.businessName}" (${prop.residents})` : prop.residents}
                  </div>
                  {prop.ownerName && (
                    <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                      בעל הדירה: {prop.ownerName}
                    </div>
                  )}
                </div>

                {/* Payment Method & Recurring Day Badge */}
                <div className="my-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{prop.paymentMethod}</span>
                  </div>

                  {prop.recurringDayText && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100/80">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>מועד כניסה קבוע: {prop.recurringDayText}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {prop.notes && (
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {prop.notes}
                  </p>
                )}
              </div>

              {/* Bottom Row: Balance & Status */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">יתרת חשבון:</span>
                  {hasDebt ? (
                    <span className="font-black text-rose-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {prop.currentBalance} ₪
                    </span>
                  ) : (
                    <span className="font-black text-emerald-700 text-sm flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      0.00 ₪
                    </span>
                  )}
                </div>

                <div>
                  {hasDebt ? (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black text-xs border border-rose-200">
                      דרוש מעקב
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      מוסדר
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

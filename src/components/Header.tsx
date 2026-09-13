import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Shield, 
  User, 
  Calendar, 
  PlusCircle, 
  FileSpreadsheet, 
  RotateCcw, 
  Info, 
  Layers, 
  Users, 
  PieChart, 
  ShieldCheck, 
  Bell, 
  Sparkles, 
  FileText,
  UserCheck,
  LogIn,
  LogOut,
  Key
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { LoginModal } from './auth/LoginModal';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, onOpenImportModal }) => {
  const { 
    role, 
    setRole, 
    selectedProperty, 
    setSelectedProperty,
    activeMonth,
    setActiveMonth,
    activeTab,
    setActiveTab,
    properties,
    transactions,
    currentUser,
    logout,
    resetToMockData
  } = useBuilding();

  const [showFeeTooltip, setShowFeeTooltip] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const months = useMemo(() => {
    const monthNames: Record<string, string> = {
      '01': 'ינואר',
      '02': 'פברואר',
      '03': 'מרץ (עדכון ביטוח)',
      '04': 'אפריל',
      '05': 'מאי',
      '06': 'יוני',
      '07': 'יולי (פרויקט צנרת)',
      '08': 'אוגוסט',
      '09': 'ספטמבר 2026 (נוכחי)',
      '10': 'אוקטובר',
      '11': 'נובמבר',
      '12': 'דצמבר'
    };

    const standard2026 = [
      '2026-09', '2026-08', '2026-07', '2026-06',
      '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'
    ];

    const uniqueFromTx = Array.from(
      new Set(transactions.map(t => t.date.substring(0, 7)).filter(Boolean))
    );

    const allKeys = Array.from(new Set([...standard2026, ...uniqueFromTx])).sort().reverse();

    return allKeys.map(key => {
      const [year, month] = key.split('-');
      const label = monthNames[month] ? `${monthNames[month]} ${year}` : key;
      return { id: key, label };
    });
  }, [transactions]);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        
        {/* Top Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
            
            {/* Logo & Building Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    ניהול ועד הבית • הידידות 5, הוד השרון
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200/60">
                    7 דירות + 2 עסקים
                  </span>
                </div>
                
                {/* Monthly Fee Summary with Info Tooltip */}
                <div className="flex items-center gap-2 mt-0.5 relative">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    דמי ועד שוטפים: 270 ₪
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    (מעודכן ממרץ לכיסוי ביטוח מורחב)
                  </span>
                  
                  <button
                    onMouseEnter={() => setShowFeeTooltip(true)}
                    onMouseLeave={() => setShowFeeTooltip(false)}
                    onClick={() => setShowFeeTooltip(!showFeeTooltip)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    title="מידע על דמי הועד"
                  >
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  {/* Tooltip */}
                  {showFeeTooltip && (
                    <div className="absolute top-6 right-0 z-50 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in zoom-in duration-100">
                      <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> פירוט תעריף דמי הועד:
                      </div>
                      <p className="leading-relaxed text-slate-200">
                        תעריף הבסיס של 270 ₪ כולל את כיסוי ביטוח המבנה המורחב (אופציה 3). 
                        <span className="text-amber-200 block mt-1">
                          * דירת הפנטהאוז של צחי ועיינה (דירה 7) משלמת תעריף מותאם של 405 ₪ עקב דירה וחצי (כולל יחידת דיור פנימית עם דייר, תוספת של 30 ₪ במקום 20 ₪).
                        </span>
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Controls, Auth & Role Switcher */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              
              {/* Month Filter */}
              {role === 'admin' && (
                <div className="relative flex items-center">
                  <Calendar className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={activeMonth}
                    onChange={(e) => setActiveMonth(e.target.value)}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200/70 border border-slate-300 text-slate-700 py-1.5 pr-8 pl-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                  >
                    {months.map((m: { id: string; label: string }) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* User Identity / Login Button */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-white font-black text-[11px] flex items-center justify-center">
                    {currentUser.apartmentNumber}
                  </div>
                  <div className="text-right leading-tight">
                    <span className="font-bold text-slate-800 block text-[11px] truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentUser.role === 'admin' ? 'ועד בית (מנהל)' : `דייר דירה ${currentUser.apartmentNumber}`}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mr-1"
                    title="התנתק"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  התחבר למערכת
                </button>
              )}

              {/* Admin Quick Action Buttons */}
              {role === 'admin' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenAddModal}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all"
                    title="הוספת תנועה חדשה"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">הוסף תנועה</span>
                  </button>

                  <button
                    onClick={onOpenImportModal}
                    className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-2 py-1.5 rounded-xl shadow-xs transition-all"
                    title="ייבוא מאקסל או ייצוא דוח"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('האם לאפס את הנתונים למצב ברירת המחדל של הידידות 5?')) {
                        resetToMockData();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="איפוס לנתוני הבניין"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Tab Navigation (Admin Only) — 4 clear sections */}
          {role === 'admin' && (
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto border-t border-slate-100 pt-1 -mb-px scrollbar-none text-sm font-bold">
              
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === 'overview'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                סקירה
              </button>

              <button
                onClick={() => setActiveTab('tenants_mgmt')}
                className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === 'tenants_mgmt' || activeTab === 'residents'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-600" />
                דיירים
              </button>

              <button
                onClick={() => setActiveTab('financials')}
                className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === 'financials'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PieChart className="w-4 h-4" />
                כספים
              </button>

              <button
                onClick={() => setActiveTab('insurance')}
                className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === 'insurance' || activeTab === 'notices'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                ביטוח וקהילה
              </button>

            </div>
          )}

        </div>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

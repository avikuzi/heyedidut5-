import React, { useState } from 'react';
import { BuildingProvider, useBuilding } from './context/BuildingContext';
import { Header } from './components/Header';
import { KpiHeader } from './components/KpiHeader';
import { RetroactiveDuesCard } from './components/RetroactiveDuesCard';
import { MonthlyCollectionBreakdown } from './components/MonthlyCollectionBreakdown';
import { PropertyDirectory } from './components/PropertyDirectory';
import { CompletedProjectsCard } from './components/CompletedProjectsCard';
import { InsuranceDashboard } from './components/InsuranceDashboard';
import { CommunityDecisions } from './components/CommunityDecisions';
import { SafetyRulesCard } from './components/SafetyRulesCard';
import { VisualAnalytics } from './components/VisualAnalytics';
import { DataGrid } from './components/DataGrid';
import { TenantManagement } from './components/admin/TenantManagement';
import { PersonalTenantPortal } from './components/tenant/PersonalTenantPortal';
import { InviteRegisterPage } from './components/auth/InviteRegisterPage';
import { PortalGateway } from './components/auth/PortalGateway';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ImportExportModal } from './components/ImportExportModal';
import { HazardReportModal } from './components/HazardReportModal';
import { GoodNeighborCharterModal } from './components/GoodNeighborCharterModal';
import { Building2, ShieldCheck, FileText } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { 
    currentUser,
    role, 
    activeTab,
    setActiveTab,
    inviteTokenFromUrl, 
    setInviteTokenFromUrl 
  } = useBuilding();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false);

  // 1. If visitor arrived via invite link with token
  if (inviteTokenFromUrl) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-hebrew py-8">
        <InviteRegisterPage 
          tokenString={inviteTokenFromUrl} 
          onCancel={() => {
            setInviteTokenFromUrl(null);
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }} 
        />
      </div>
    );
  }

  // 2. If unauthenticated, show secure login gateway (Strict Separation)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-hebrew flex flex-col justify-between">
        <div className="py-12">
          <PortalGateway />
        </div>
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="font-black text-slate-800">ועד בית • הידידות 5, הוד השרון</span>
            <span className="text-slate-400">| מערכת מאובטחת</span>
          </div>
        </footer>
      </div>
    );
  }

  // 3. Authenticated View (Strict RBAC: Tenant vs Admin)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-hebrew">
      <div>
        {/* Header */}
        <Header
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* TENANT PERSONAL PORTAL (Strict Data Privacy - No Admin Access) */}
          {role === 'tenant' ? (
            <PersonalTenantPortal />
          ) : (
            /* ADMIN VIEW (Avi - Building Manager) */
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">סקירת ועד הבית</h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      מצב הקופה, חובות שדורשים טיפול, וגבייה חודשית — במקום אחד.
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('tenants_mgmt')}
                        className="text-right p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 min-h-[72px]"
                      >
                        <div className="text-sm font-black text-indigo-900">דיירים והזמנות</div>
                        <div className="text-xs text-indigo-700/80 mt-1">ניהול גישה וספר נכסים</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('financials')}
                        className="text-right p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 min-h-[72px]"
                      >
                        <div className="text-sm font-black text-emerald-900">כספים</div>
                        <div className="text-xs text-emerald-700/80 mt-1">יומן, פרויקטים וניתוח</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('insurance')}
                        className="text-right p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 min-h-[72px]"
                      >
                        <div className="text-sm font-black text-slate-900">ביטוח וקהילה</div>
                        <div className="text-xs text-slate-600 mt-1">ביטוח, החלטות ותקנון</div>
                      </button>
                    </div>
                  </div>
                  <KpiHeader />
                  <RetroactiveDuesCard />
                  <MonthlyCollectionBreakdown />
                </div>
              )}

              {(activeTab === 'tenants_mgmt' || activeTab === 'residents') && (
                <div className="space-y-6">
                  <TenantManagement />
                  <PropertyDirectory onOpenHazardModal={() => setIsHazardModalOpen(true)} />
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="space-y-6">
                  <KpiHeader />
                  <CompletedProjectsCard />
                  <VisualAnalytics />
                  <DataGrid onOpenAddModal={() => setIsAddModalOpen(true)} />
                </div>
              )}

              {(activeTab === 'insurance' || activeTab === 'notices') && (
                <div className="space-y-6">
                  <InsuranceDashboard />
                  <CommunityDecisions />
                  <SafetyRulesCard onOpenCharterModal={() => setIsCharterModalOpen(true)} />
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <HazardReportModal
        isOpen={isHazardModalOpen}
        onClose={() => setIsHazardModalOpen(false)}
      />

      <GoodNeighborCharterModal
        isOpen={isCharterModalOpen}
        onClose={() => setIsCharterModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="font-black text-slate-800">ועד בית • הידידות 5, הוד השרון</span>
            <span className="text-slate-400">| ניהול ועד: אבי קוזי (דירה 2)</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <button 
              onClick={() => setIsCharterModalOpen(true)}
              className="hover:text-slate-900 underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> אמנת השכנות הטובה
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> פורטל דיירים מאובטח
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BuildingProvider>
      <DashboardContent />
    </BuildingProvider>
  );
}

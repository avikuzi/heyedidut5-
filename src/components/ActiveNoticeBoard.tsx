import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  Zap, 
  Sparkles, 
  Calendar, 
  Lightbulb, 
  CheckCircle2, 
  Heart,
  Users
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';

export const ActiveNoticeBoard: React.FC = () => {
  const { notices, acknowledgeNotice } = useBuilding();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 mb-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              לוח מודעות והודעות פעילות
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              עדכונים חמים, עבודות תשתית ואישורי קריאה של הדיירים
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {notices.length} הודעות פעילות
        </span>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.map((notice) => {
          const isSmartMeter = notice.id === 'notice-1';

          return (
            <div
              key={notice.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-amber-50/20 hover:border-amber-300/80 transition-all space-y-3 relative overflow-hidden"
            >
              {/* Notice Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${isSmartMeter ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                    {isSmartMeter ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                      <span className="text-indigo-700 font-bold">{notice.date}</span>
                      <span>• מאת: {notice.author}</span>
                    </div>
                  </div>
                </div>

                {/* Read Confirmation Button */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {notice.acknowledgedCount} אישרו שקראו
                  </span>

                  <button
                    onClick={() => acknowledgeNotice(notice.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      notice.isAcknowledgedByMe
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {notice.isAcknowledgedByMe ? 'קראתי ואישרתי ✅' : 'אישרתי שקראתי'}
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                {notice.content}
              </p>

              {/* Tip Box if available */}
              {notice.tip && (
                <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{notice.tip}</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

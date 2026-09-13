import React from 'react';
import { 
  Award, 
  HeartHandshake, 
  CheckCircle2, 
  Sparkles, 
  Gift, 
  Vote,
  Calendar
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';

export const CommunityDecisions: React.FC = () => {
  const { decisions } = useBuilding();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 mb-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            החלטות קהילה והוקרה
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            החלטות שהתקבלו בהצבעת הדיירים והבעת תודה לבעלי המקצוע של הבניין
          </p>
        </div>
      </div>

      {/* Decisions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decisions.map((item) => {
          const isGift = item.category === 'recognition';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isGift 
                  ? 'bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 border-rose-200/80 shadow-xs'
                  : 'bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 border-emerald-200/80 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl text-white ${isGift ? 'bg-rose-500' : 'bg-emerald-600'}`}>
                      {isGift ? <Gift className="w-4 h-4" /> : <Vote className="w-4 h-4" />}
                    </div>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    isGift ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.badgeText}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 mb-2">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  {item.summary}
                </p>
              </div>

              {item.votesDetail && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item.votesDetail}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

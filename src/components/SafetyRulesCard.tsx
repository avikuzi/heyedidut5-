import React from 'react';
import { 
  AlertOctagon, 
  Flame, 
  Bike, 
  ShieldAlert, 
  HeartHandshake, 
  FileText, 
  Building,
  CheckCircle2
} from 'lucide-react';

interface SafetyRulesCardProps {
  onOpenCharterModal: () => void;
}

export const SafetyRulesCard: React.FC<SafetyRulesCardProps> = ({ onOpenCharterModal }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 mb-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              בטיחות, שמירה על הרכוש וכללי הבניין
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              הנחיות בטיחות אש, שימוש במקלט ושכנות טובה
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCharterModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          אמנת השכנות הטובה של הבניין
        </button>
      </div>

      {/* Warning 1: Cigarettes & Super HaKikar Awning */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50/40 border-2 border-rose-300/80 shadow-xs relative space-y-2">
        <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
          <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
          <span>אזהרת בטיחות חמורה: איסור השלכת בדלי סיגריות מהמרפסות!</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          חל איסור חמור על השלכת בדלי סיגריות מהמרפסות! הדבר פוגע ישירות בסככת <strong>"סופר הכיכר"</strong> שמתחת לבניין ומהווה <strong>סכנת שריפה חמורה</strong> לחיי אדם ולרכוש. 
          אנו פועלים בשיתוף פעולה מלא עם ועד הבניין השכן למניעת התופעה ושמירה על ביטחון כולנו.
        </p>

        <div className="pt-2 flex items-center gap-1.5 text-xs text-rose-700 font-bold">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>אנא השתמשו במאפרות ייעודיות והימנעו מהשלכה מכל סוג לרחוב או לסככות.</span>
        </div>
      </div>

      {/* Reminder 2: Bicycles in Shelter */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
          <Bike className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-black text-slate-900">
            תזכורת חניה ואחסון אופניים במקלט
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            אנא ודאו שכל האופניים, הקורקינטים והעגלות מוחזרים למתקן הייעודי שבתוך המקלט, על מנת לשמור על חדר מדרגות פנוי ובטיחותי למעבר בשעת חירום.
          </p>
        </div>
      </div>

    </div>
  );
};

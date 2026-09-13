import React from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  Flame, 
  Bike, 
  HeartHandshake, 
  Sparkles,
  Building
} from 'lucide-react';

interface GoodNeighborCharterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoodNeighborCharterModal: React.FC<GoodNeighborCharterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">אמנת השכנות הטובה והבטיחות</h2>
              <p className="text-xs text-slate-500">הידידות 5, הוד השרון • כללי הבית המשותף</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors"
              title="הדפסת האמנה"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed max-h-[75vh] overflow-y-auto">
          
          <div className="text-center pb-4 border-b border-slate-100">
            <h1 className="text-xl font-black text-slate-900">
              אמנת השכנות הטובה • הידידות 5, הוד השרון
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              מסמך עקרונות משותף לכלל דיירי ועסקי הבניין לחיים בטוחים, נעימים ומטופחים
            </p>
          </div>

          {/* Section 1: Fire Safety & Awning */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>1. מניעת סכנות אש ואיסור השלכת בדלי סיגריות</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              חל איסור מוחלט על השלכת בדלי סיגריות, גפרורים או פסולת מחלונות ומרפסות הבניין. השלכה זו פוגעת בסככת <strong>"סופר הכיכר"</strong> ועלולה לגרום לדליקה מסכנת חיים. ועד הבניין פועל בשיתוף פעולה עם ועד הבניין השכן לאכיפת הנחיה זו.
            </p>
          </div>

          {/* Section 2: Shelter & Bike Storage */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Bike className="w-4 h-4 text-indigo-600" />
              <span>2. שמירה על המקלט ומעברי המדרגות פנויים</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              כל האופניים, הקורקינטים ועגלות הילדים יוחזרו אך ורק למתקן הייעודי שבתוך המקלט. חל איסור על חסימת מעברים, לובי או חדרי מדרגות כדי להבטיח פינוי מהיר ובטוח בשעת חירום.
            </p>
          </div>

          {/* Section 3: Insurance & Joint Infrastructure */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. ביטוח מבנה מורחב ואחריות הדדית</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              הבניין מבוטח בפוליסה מורחבת (אופציה 3) המכסה אש, סערה, רעידות אדמה, נזקי צנרת מים מורחבים, צד ג' וחבות מעבידים עבור כל 9 הנכסים. תשלום דמי הועד החודשיים (270 ₪) בזמן מבטיח את המשך תוקף הפוליסה והגנת הרכוש המשותף.
            </p>
          </div>

          {/* Section 4: Cleanliness & Mutual Respect */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>4. שמירה על הניקיון וכבוד לצוות התחזוקה</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              אנו שומרים על ניקיון רחבת הכניסה, הפחים וחדר המדרגות, ומוקירים תודה לעובדי הניקיון והתחזוקה על עבודתם המסורה.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            ועד הבית • אבי קוזי (דירה 2)
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            הדפסה / שמירה כ-PDF
          </button>
        </div>

      </div>
    </div>
  );
};

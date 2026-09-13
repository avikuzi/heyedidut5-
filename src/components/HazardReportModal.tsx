import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';

interface HazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HazardReportModal: React.FC<HazardReportModalProps> = ({ isOpen, onClose }) => {
  const { reportHazard, properties } = useBuilding();

  const [title, setTitle] = useState('מפגע בסככת סופר הכיכר (פסולת / סכנת אש)');
  const [location, setLocation] = useState('סככת סופר הכיכר / חזית קרקע');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('דירה 2 (אבי - ועד הבית)');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('נא להזין תיאור של המפגע');
      return;
    }

    reportHazard({
      title,
      location,
      description: description.trim(),
      reportedBy
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setDescription('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">דיווח מהיר על מפגע בבניין</h2>
              <p className="text-xs text-slate-500">העברת פנייה מיידית לטיפול ועד הבית והנהלת העסק</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-slate-900">הדיווח נרשם בהצלחה!</h3>
            <p className="text-xs text-slate-500">הפנייה הועברה לטיפול ועד הבית והגורמים הרלוונטיים.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">נושא המפגע:</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">מיקום:</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">מדווח על ידי:</label>
              <select
                value={reportedBy}
                onChange={e => setReportedBy(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              >
                {properties.map(p => (
                  <option key={p.id} value={`${p.title} (${p.businessName || p.residents})`}>
                    {p.title} - {p.businessName || p.residents}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">תיאור המפגע ופרטים נוספים:</label>
              <textarea
                required
                rows={3}
                placeholder="תאר את המפגע (לדוגמה: בדלי סיגריות/אשפה שנחתו על הסככה, צורך בניקוי או בדיקה)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                שלח דיווח לטיפול
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

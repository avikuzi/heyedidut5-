import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, login, switchUser, currentUser } = useBuilding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = login(email, password);
    if (success) {
      onClose();
    } else {
      setError('לא נמצא משתמש עם כתובת דוא"ל זו. נא ודא שנרשמת דרך קישור הזמנה מהוועד.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-right">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">התחברות לפורטל</h2>
              <p className="text-[11px] text-indigo-200">הידידות 5, הוד השרון</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                כתובת דוא"ל:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                סיסמה:
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              התחבר
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              מעבר מהיר לבדיקה (חשבונות מוגדרים מראש):
            </span>
            <div className="space-y-1.5">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.id)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    currentUser?.id === u.id 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                      u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {u.apartmentNumber}
                    </span>
                    <span>{u.name} ({u.role === 'admin' ? 'מנהל ועד' : `דירה ${u.apartmentNumber}`})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {u.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-500">
              ההרשמה למערכת מתבצעת אך ורק דרך קישור הזמנה ייעודי שנשלח על ידי ועד הבית.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

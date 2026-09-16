import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useBuilding } from '../../context/BuildingContext';

interface InviteRegisterPageProps {
  tokenString: string;
  onCancel: () => void;
}

export const InviteRegisterPage: React.FC<InviteRegisterPageProps> = ({ tokenString, onCancel }) => {
  const { invitationTokens, registerWithToken, properties, peekInvitationInfo } = useBuilding();

  const localToken = invitationTokens.find(t => t.token === tokenString);
  const localProperty = localToken
    ? properties.find(p => p.propertyNumber === localToken.apartmentNumber)
    : null;

  const [peeked, setPeeked] = useState<{
    apartmentNumber: number;
    isUsed: boolean;
    propertyTitle?: string;
    residents?: string;
  } | null>(localToken ? {
    apartmentNumber: localToken.apartmentNumber,
    isUsed: localToken.isUsed,
    propertyTitle: localProperty?.title,
    residents: localProperty?.residents
  } : null);
  const [peekDone, setPeekDone] = useState(Boolean(localToken));

  const [formData, setFormData] = useState({
    name: localProperty ? localProperty.residents.split(' ')[0] : '',
    email: '',
    phone: '',
    password: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    peekInvitationInfo(tokenString)
      .then((info) => {
        if (cancelled) return;
        setPeeked(info);
        if (info?.residents) {
          setFormData((prev) => prev.name ? prev : { ...prev, name: info.residents!.split(' ')[0] });
        }
      })
      .catch(() => {
        if (!cancelled) setPeeked(null);
      })
      .finally(() => {
        if (!cancelled) setPeekDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenString, peekInvitationInfo]);

  const isUsed = peeked?.isUsed;
  const isValid = Boolean(peeked) && !isUsed;
  const tokenObj = peeked ? { apartmentNumber: peeked.apartmentNumber } : localToken;
  const linkedProperty = {
    title: peeked?.propertyTitle || localProperty?.title,
    residents: peeked?.residents || localProperty?.residents
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('נא למלא שם מלא.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('נא למלא כתובת דוא"ל תקינה.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('נא למלא מספר טלפון.');
      return;
    }
    if (!formData.password || formData.password.length < 3) {
      setError('נא לבחור סיסמה (לפחות 3 תווים).');
      return;
    }

    setIsSubmitting(true);
    const res = await registerWithToken(tokenString, formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'שגיאה בעת ההרשמה.');
      return;
    }
    if (res.needsEmailConfirmation) {
      setNeedsEmailConfirmation(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black">
            הרשמה לפורטל הדיירים
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            הידידות 5, הוד השרון • הרשמה בהזמנה אישית בלבד
          </p>
        </div>

        <div className="p-6 space-y-5">
          {needsEmailConfirmation && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm leading-relaxed">
              ההרשמה נקלטה. אשרו את כתובת הדוא״ל ואז היכנסו לפורטל.
            </div>
          )}

          {!peekDone && (
            <div className="text-sm text-slate-500 text-center py-6">בודק את קישור ההזמנה…</div>
          )}

          {/* Invalid / Used Token Alert */}
          {peekDone && !isValid && !needsEmailConfirmation && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-black">
                {isUsed ? 'קישור הזמנה זה כבר נוצל' : 'קישור ההזמנה אינו תקין'}
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                {isUsed 
                  ? 'ההרשמה באמצעות קישור זה כבר הושלמה בעבר. אם כבר נרשמת, באפשרותך להתחבר ישירות למערכת.'
                  : 'הקישור שברשותך אינו תקף או שפג תוקפו. אנא פנה לאבי הוועד לקבלת קישור הזמנה חדש.'}
              </p>
              <button
                onClick={onCancel}
                className="mt-2 text-xs font-black text-indigo-700 underline"
              >
                חזרה למסך הראשי
              </button>
            </div>
          )}

          {/* Valid Token Form */}
          {peekDone && isValid && !needsEmailConfirmation && (
            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              
              {/* Locked Apartment Number Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>מספר דירה משויכת (נעול):</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> משויך מההזמנה
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${linkedProperty.title || `דירה ${tokenObj?.apartmentNumber}`} (${linkedProperty.residents || ''})`}
                    className="w-full text-xs font-black bg-slate-100 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-700 cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  שם מלא:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="ישראל ישראלי"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <UserIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  כתובת דוא"ל:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  מספר טלפון ליצירת קשר:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="050-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  סיסמה:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pr-9 pl-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'מבצע הרשמה...' : 'השלמת הרשמה וכניסה לפורטל'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ביטול וחזרה
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

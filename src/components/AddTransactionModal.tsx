import React, { useState } from 'react';
import { X, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { TransactionCategory, TransactionType } from '../types';
import { CATEGORY_MAP } from '../services/categories';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, properties } = useBuilding();

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('cleaning');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('נא להזין סכום חיובי תקין.');
      return;
    }
    if (!description.trim()) {
      alert('נא להזין תיאור לתנועה.');
      return;
    }

    addTransaction({
      date,
      description: description.trim(),
      reference: reference.trim() || `MANUAL-${Date.now().toString().slice(-4)}`,
      category,
      type,
      amount: numAmount,
      status: 'completed',
      propertyId: propertyId ? parseInt(propertyId, 10) : undefined,
      apartmentNumber: propertyId ? parseInt(propertyId, 10) : undefined,
      notes: notes.trim() || undefined
    });

    onClose();
    setDescription('');
    setAmount('');
    setReference('');
    setNotes('');
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('tenant_dues');
    } else {
      setCategory('cleaning');
    }
  };

  const availableCategories = Object.entries(CATEGORY_MAP).filter(
    ([_, meta]) => meta.type === type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">הוספת תנועה חדשה</h2>
              <p className="text-xs text-slate-500">רישום הכנסה או הוצאה ביומן ועד הבית</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">סוג התנועה:</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                הוצאה
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                הכנסה (גבייה)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">קטגוריה:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {availableCategories.map(([key, meta]) => (
                  <option key={key} value={key}>{meta.nameHe}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">תאריך:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תיאור הפעולה / שם ספק:</label>
            <input
              type="text"
              required
              placeholder="לדוגמה: ניקיון חודשי / דמי ועד / טיפול גינון"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">סכום בש"ח (₪):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">אסמכתא / קבלה:</label>
              <input
                type="text"
                placeholder="מספר קבלה / אסמכתא"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {type === 'income' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">שיוך לנכס (אופציונלי):</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">-- כלל הנכסים / ללא שיוך --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.propertyNumber}>
                    {p.title} - {p.businessName || p.residents}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">הערות נוספות (אופציונלי):</label>
            <input
              type="text"
              placeholder="הערות פנימיות לוועד..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md transition-all"
            >
              שמור תנועה
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

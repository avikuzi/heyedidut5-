import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  FileCheck,
  Zap
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { parseStatementFile, exportTransactionsToExcel } from '../services/excelParser';
import { Transaction } from '../types';
import { formatCurrency } from '../services/financialAnalytics';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { importTransactions, transactions } = useBuilding();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setErrorMsg(null);
    setSuccessCount(null);
    setIsProcessing(true);

    try {
      const parsed = await parseStatementFile(file);
      if (parsed.length === 0) {
        throw new Error('לא זוהו תנועות תקינות בקובץ. וודא שזהו דוח תנועות בנקאי או קובץ אקסל תקין.');
      }
      setPreviewTransactions(parsed);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'שגיאה בעיבוד הקובץ.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const confirmImport = () => {
    if (previewTransactions && previewTransactions.length > 0) {
      importTransactions(previewTransactions);
      setSuccessCount(previewTransactions.length);
      setPreviewTransactions(null);
    }
  };

  const handleExport = () => {
    exportTransactionsToExcel(transactions, `דוח_ועד_בית_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ייבוא וייצוא דפי חשבון</h2>
              <p className="text-xs text-slate-500">סנכרון תנועות מאקסל (XLS/XLSX/CSV) או ייצוא דוחות כספיים</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Success Message */}
          {successCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successCount} תנועות יובאו בהצלחה ליומן החשבון!</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
              >
                סגור
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Drop Zone (if not in preview mode) */}
          {!previewTransactions && successCount === null && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.value && e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h3 className="text-sm font-bold text-slate-800">
                {isProcessing ? 'מעבד את הקובץ...' : 'גרור קובץ אקסל או לחץ לבחירה'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                תומך בקבצי תנועות בנקאיים של בנק לאומי, הפועלים, מזרחי, דיסקונט, וקובצי Excel סטנדרטיים (.xls, .xlsx, .csv)
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>זיהוי אוטומטי של תאריכים, סכומי חובה/זכות, וקטגוריות</span>
              </div>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {previewTransactions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    תצוגה מקדימה • זוהו {previewTransactions.length} תנועות בקובץ
                  </h3>
                  <p className="text-xs text-slate-500">
                    סה"כ הכנסות: {formatCurrency(previewTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))} | 
                    סה"כ הוצאות: {formatCurrency(previewTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTransactions(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={confirmImport}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    אישור וייבוא ליומן
                  </button>
                </div>
              </div>

              {/* Mini preview table */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">תאריך</th>
                      <th className="py-2 px-3">תיאור</th>
                      <th className="py-2 px-3">קטגוריה</th>
                      <th className="py-2 px-3 text-left">סכום</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewTransactions.slice(0, 15).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600">{t.date}</td>
                        <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-xs">{t.description}</td>
                        <td className="py-2 px-3 text-slate-500">{t.category}</td>
                        <td className={`py-2 px-3 font-bold text-left ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Section */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800">ייצוא נתונים מקומי</h4>
              <p className="text-[11px] text-slate-500">הורדת כל יומן התנועות הנוכחי לקובץ אקסל מסודר</p>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              הורד דוח מלא (.xlsx)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

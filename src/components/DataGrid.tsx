import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus,
  Zap,
  Trees,
  Sparkles,
  Droplets,
  ShieldCheck,
  Wrench,
  Home,
  PiggyBank,
  MoreHorizontal,
  Store
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import { TransactionCategory } from '../types';
import { CATEGORY_MAP, getCategoryName } from '../services/categories';
import { formatCurrency } from '../services/financialAnalytics';
import { exportTransactionsToExcel } from '../services/excelParser';

interface DataGridProps {
  onOpenAddModal: () => void;
}

type SortField = 'date' | 'amount' | 'category' | 'description' | 'balance';
type SortOrder = 'asc' | 'desc';

export const DataGrid: React.FC<DataGridProps> = ({ onOpenAddModal }) => {
  const { transactions, deleteTransaction, role } = useBuilding();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(query);
        const refMatch = tx.reference.toLowerCase().includes(query);
        const catMatch = getCategoryName(tx.category).toLowerCase().includes(query);
        const amountMatch = String(tx.amount).includes(query);
        const propMatch = tx.propertyId ? String(tx.propertyId).includes(query) : false;
        return descMatch || refMatch || catMatch || amountMatch || propMatch;
      }
      return true;
    });
  }, [transactions, selectedType, selectedCategory, searchQuery]);

  // Sorting
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'balance') {
        comparison = (a.balance ?? 0) - (b.balance ?? 0);
      } else if (sortField === 'category') {
        comparison = getCategoryName(a.category).localeCompare(getCategoryName(b.category), 'he');
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description, 'he');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    exportTransactionsToExcel(sortedTransactions, `דוח_תנועות_הידידות_5_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case 'electricity': return <Zap className="w-3.5 h-3.5" />;
      case 'gardening': return <Trees className="w-3.5 h-3.5" />;
      case 'cleaning': return <Sparkles className="w-3.5 h-3.5" />;
      case 'water': return <Droplets className="w-3.5 h-3.5" />;
      case 'insurance': return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'maintenance': return <Wrench className="w-3.5 h-3.5" />;
      case 'tenant_dues': return <Home className="w-3.5 h-3.5" />;
      case 'commercial_dues': return <Store className="w-3.5 h-3.5" />;
      case 'special_fund': return <PiggyBank className="w-3.5 h-3.5" />;
      default: return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden mb-8">
      
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                יומן תנועות חשבון • הידידות 5
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {sortedTransactions.length} תנועות
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              פירוט הכנסות והוצאות, גביית צנרת מיוחדת ותשלומי ביטוח מורחב
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {role === 'admin' && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                תנועה חדשה
              </button>
            )}

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all"
              title="הורדת הטבלה לאקסל"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              ייצוא לאקסל
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש לפי תיאור, אסמכתא, קטגוריה או סכום..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 pr-9 pl-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="all">כל הסוגים</option>
              <option value="income">הכנסות וגבייה</option>
              <option value="expense">הוצאות</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="all">כל הקטגוריות</option>
              {Object.entries(CATEGORY_MAP).map(([key, meta]) => (
                <option key={key} value={key}>{meta.nameHe}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th onClick={() => toggleSort('date')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span>תאריך</span>
                  {sortField === 'date' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              <th onClick={() => toggleSort('category')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span>קטגוריה</span>
                  {sortField === 'category' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              <th onClick={() => toggleSort('description')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span>תיאור הפעולה</span>
                  {sortField === 'description' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              <th className="py-3 px-4 text-slate-500">אסמכתא</th>

              <th onClick={() => toggleSort('amount')} className="py-3 px-4 cursor-pointer hover:text-slate-900 text-left">
                <div className="flex items-center justify-end gap-1.5">
                  <span>סכום (₪)</span>
                  {sortField === 'amount' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              <th onClick={() => toggleSort('balance')} className="py-3 px-4 cursor-pointer hover:text-slate-900 text-left">
                <div className="flex items-center justify-end gap-1.5">
                  <span>יתרה (₪)</span>
                  {sortField === 'balance' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                </div>
              </th>

              <th className="py-3 px-4 text-center">סטטוס</th>

              {role === 'admin' && (
                <th className="py-3 px-4 text-center">פעולות</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.map((tx) => {
              const categoryMeta = CATEGORY_MAP[tx.category];
              const isIncome = tx.type === 'income';

              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">{tx.date}</td>
                  
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{
                        backgroundColor: `${categoryMeta?.color || '#94a3b8'}15`,
                        color: categoryMeta?.color || '#475569',
                        border: `1px solid ${categoryMeta?.color || '#94a3b8'}30`
                      }}
                    >
                      {renderCategoryIcon(tx.category)}
                      {categoryMeta?.nameHe || tx.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">{tx.description}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{tx.reference}</td>

                  <td className="py-3.5 px-4 font-black text-left whitespace-nowrap">
                    <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-600 text-left whitespace-nowrap">
                    {tx.balance !== undefined ? formatCurrency(tx.balance) : '-'}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> הושלם
                    </span>
                  </td>

                  {role === 'admin' && (
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`האם למחוק את התנועה "${tx.description}"?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="מחק תנועה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          מציג {sortedTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} עד{' '}
          {Math.min(currentPage * pageSize, sortedTransactions.length)} מתוך {sortedTransactions.length} תנועות
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700"
          >
            הקודם
          </button>
          <span className="px-3 py-1.5 font-bold text-slate-800">
            עמוד {currentPage} מתוך {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700"
          >
            הבא
          </button>
        </div>
      </div>

    </div>
  );
};

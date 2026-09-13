import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useBuilding } from '../context/BuildingContext';
import { formatCurrency, getCategoryBreakdown, getMonthlyAnalytics } from '../services/financialAnalytics';
import { BarChart3, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export const VisualAnalytics: React.FC = () => {
  const { transactions, activeMonth } = useBuilding();
  const [breakdownView, setBreakdownView] = useState<'current_month' | 'all_time'>('current_month');

  const monthlyData = getMonthlyAnalytics(transactions, 6);
  const categoryBreakdown = getCategoryBreakdown(
    transactions, 
    breakdownView === 'current_month' ? activeMonth : undefined
  );

  const totalFilteredExpense = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  // 1. Bar Chart Data (Monthly Income vs. Expenses)
  const barChartData = {
    labels: monthlyData.map(d => d.monthNameHe),
    datasets: [
      {
        label: 'הכנסות (₪)',
        data: monthlyData.map(d => d.income),
        backgroundColor: '#10b981', // emerald
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'הוצאות (₪)',
        data: monthlyData.map(d => d.expenses),
        backgroundColor: '#f43f5e', // rose
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true,
        labels: {
          font: {
            family: 'Rubik, system-ui, sans-serif',
            size: 12,
            weight: 'bold' as const
          },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl' as const,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            return ` ${label}: ${formatCurrency(val)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Rubik, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          callback: (value: any) => `₪${value.toLocaleString('he-IL')}`,
          font: {
            family: 'Rubik, system-ui, sans-serif'
          }
        }
      }
    }
  };

  // 2. Doughnut Chart Data (Expense Breakdown)
  const doughnutData = {
    labels: categoryBreakdown.map(c => c.nameHe),
    datasets: [
      {
        data: categoryBreakdown.map(c => c.amount),
        backgroundColor: categoryBreakdown.map(c => c.color),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false // We render a custom rich legend below
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl' as const,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const val = context.parsed;
            const percentage = totalFilteredExpense > 0 
              ? Math.round((val / totalFilteredExpense) * 100) 
              : 0;
            return ` ${label}: ${formatCurrency(val)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* 1. Bar Chart: Monthly Income vs Expenses (7 Cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  הכנסות מול הוצאות חודשיות
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  השוואת תזרים 6 חודשים אחרונים
                </p>
              </div>
            </div>

            {/* Quick badges */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                הכנסות
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                הוצאות
              </span>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Bottom Monthly Summary strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-400 block text-[11px]">ממוצע הכנסות</span>
            <span className="font-bold text-emerald-700">
              {formatCurrency(monthlyData.reduce((s, d) => s + d.income, 0) / (monthlyData.length || 1))}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-400 block text-[11px]">ממוצע הוצאות</span>
            <span className="font-bold text-rose-700">
              {formatCurrency(monthlyData.reduce((s, d) => s + d.expenses, 0) / (monthlyData.length || 1))}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg">
            <span className="text-slate-400 block text-[11px]">יתרה ממוצעת</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(monthlyData[monthlyData.length - 1]?.balance || 0)}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Doughnut Chart: Expense Breakdown (5 Cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  פילוח הוצאות לפי קטגוריה
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {breakdownView === 'current_month' ? 'חודש נוכחי (אוגוסט 2026)' : 'מצטבר כל התקופות'}
                </p>
              </div>
            </div>

            {/* Toggle view */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setBreakdownView('current_month')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  breakdownView === 'current_month' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                חודשי
              </button>
              <button
                onClick={() => setBreakdownView('all_time')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  breakdownView === 'all_time' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                הכל
              </button>
            </div>
          </div>

          {/* Chart + Center Total */}
          <div className="h-48 w-full relative my-2 flex items-center justify-center">
            {categoryBreakdown.length > 0 ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-slate-400">סה"כ הוצאות</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {formatCurrency(totalFilteredExpense)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-slate-400 py-12">
                אין נתוני הוצאות לתקופה שנבחרה
              </div>
            )}
          </div>
        </div>

        {/* Interactive Custom Category Legend */}
        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {categoryBreakdown.map((item) => (
            <div 
              key={item.category}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-700">{item.nameHe}</span>
                <span className="text-[10px] text-slate-400">({item.count} תנועות)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                <span className="font-bold text-slate-500 text-[11px] w-10 text-left">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

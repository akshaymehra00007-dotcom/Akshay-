import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/dateUtils';
import { exportFeeRecordsCSV, exportStudentsCSV } from '../../utils/exportUtils';
import { BarChart3, Download, TrendingUp, DollarSign, Users, Shield, CreditCard, PieChart } from 'lucide-react';

export const ReportsAndAnalytics: React.FC = () => {
  const { feeRecords, students, courses, batches, membershipPlans, settings, stats, getComputedFeeStatus } = useApp();

  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // Course wise revenue breakdown
  const courseRevenue = courses.map((course) => {
    const studentIds = students.filter((s) => s.courseId === course.id).map((s) => s.id);
    const collected = feeRecords
      .filter((f) => studentIds.includes(f.studentId) && getComputedFeeStatus(f) === 'PAID')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalCount = studentIds.length;
    return { course, collected, totalCount };
  });

  const totalCourseRevenue = courseRevenue.reduce((sum, c) => sum + c.collected, 0) || 1;

  // Payment method breakdown
  const paidFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'PAID');
  const methodCounts: Record<string, number> = {
    UPI: 0,
    Cash: 0,
    'Bank Transfer': 0,
    Card: 0,
  };

  paidFees.forEach((f) => {
    const m = f.paymentMethod || 'UPI';
    methodCounts[m] = (methodCounts[m] || 0) + f.amount;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Financial Statements & Yield Analytics</span>
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Reconciled revenue metrics, departmental yields, and transaction ledger exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            type="button"
            onClick={() => exportFeeRecordsCSV(feeRecords, students)}
            className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-800"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Transactions (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => exportStudentsCSV(students, courses, batches)}
            className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* SUMMARY AUDIT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">
            Settled Collections (All-Time)
          </span>
          <div className="text-3xl font-serif text-emerald-400">
            {formatCurrency(stats.totalCollected, settings.currencySymbol)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            From {paidFees.length} verified receipts
          </p>
        </div>

        <div className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">
            Outstanding Tuition Receivables
          </span>
          <div className="text-3xl font-serif text-rose-400">
            {formatCurrency(stats.totalOverdue + stats.totalPending, settings.currencySymbol)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {stats.totalOverdue > 0 ? `Includes ${formatCurrency(stats.totalOverdue, settings.currencySymbol)} past due` : 'Pending collection'}
          </p>
        </div>

        <div className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">
            Avg. Tuition Per Student
          </span>
          <div className="text-3xl font-serif text-amber-400">
            {formatCurrency(
              students.length > 0 ? Math.round(stats.totalCollected / students.length) : 0,
              settings.currencySymbol
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Across {courses.length} music courses
          </p>
        </div>
      </div>

      {/* 2-COLUMNS: COURSE REVENUE & PAYMENT METHOD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Course Yield */}
        <div className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-serif italic text-zinc-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Revenue by Musical Discipline</span>
            </h3>
          </div>

          <div className="space-y-4">
            {courseRevenue.map(({ course, collected, totalCount }) => {
              const pct = Math.round((collected / totalCourseRevenue) * 100);

              return (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-sans">
                      {course.name} <span className="text-zinc-500 font-mono text-[11px]">({totalCount} enrolled)</span>
                    </span>
                    <span className="text-zinc-100 font-mono text-xs">
                      {formatCurrency(collected, settings.currencySymbol)} <span className="text-amber-400 text-[11px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Payment Channels */}
        <div className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-serif italic text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Settlement Modes & Channels</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {Object.entries(methodCounts).map(([method, amount]) => (
              <div
                key={method}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">
                  {method}
                </span>
                <div className="text-lg font-serif text-zinc-100">
                  {formatCurrency(amount, settings.currencySymbol)}
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  {stats.totalCollected > 0 ? Math.round((amount / stats.totalCollected) * 100) : 0}% of settled revenue
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

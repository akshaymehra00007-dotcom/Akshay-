import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NumberCounter } from '../common/NumberCounter';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDateFull } from '../../utils/dateUtils';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';
import { exportFeeRecordsCSV } from '../../utils/exportUtils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { StudentDetailModal } from './StudentDetailModal';
import { StudentFormModal } from './StudentFormModal';
import {
  Users,
  CreditCard,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Download,
  Plus,
  Send,
  Sparkles,
  ChevronRight,
  Music,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { FeeRecord, Student } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const {
    stats,
    students,
    feeRecords,
    courses,
    batches,
    settings,
    getComputedFeeStatus,
    getComputedMembershipStatus,
  } = useApp();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'last_month'>('month');
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRecord | null>(null);

  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [studentFormModalOpen, setStudentFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Quick lists
  const overdueFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'OVERDUE');
  const dueTodayFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'DUE TODAY');
  const upcomingFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'UPCOMING');
  const expiringSoonStudents = students.filter(
    (s) => getComputedMembershipStatus(s) === 'EXPIRING SOON' || getComputedMembershipStatus(s) === 'EXPIRING TODAY'
  );

  const recentPaidFees = feeRecords
    .filter((f) => getComputedFeeStatus(f) === 'PAID')
    .slice(0, 5);

  const handleRecordFee = (fee: FeeRecord) => {
    setSelectedFeeForPayment(fee);
    setRecordPaymentModalOpen(true);
  };

  const handleViewStudent = (studentId: string) => {
    const s = students.find((item) => item.id === studentId);
    if (s) {
      setSelectedStudentForDetail(s);
    }
  };

  // Sample monthly chart columns
  const monthlyColumns = [
    { label: 'MAY', height: 'h-28', active: false, amount: '₹18.4K' },
    { label: 'JUN', height: 'h-36', active: false, amount: '₹19.8K' },
    { label: 'JUL', height: 'h-44', active: false, amount: '₹21.5K' },
    { label: 'AUG', height: 'h-52', active: true, amount: formatCurrency(stats.totalCollected, settings.currencySymbol) },
    { label: 'SEP', height: 'h-32', active: false, amount: 'Proj' },
    { label: 'OCT', height: 'h-24', active: false, amount: 'Proj', dashed: true },
  ];

  return (
    <div className="space-y-8">
      {/* EDITORIAL HERO SECTION */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>EXECUTIVE LEDGER • {settings.instituteName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif tracking-tight text-zinc-100">
            Academy Financial & <span className="italic text-amber-500">Membership Pulse</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-sans">
            Real-time tracking of tuition dues, automated WhatsApp reminders, and student membership lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <button
            type="button"
            onClick={() => {
              setStudentToEdit(null);
              setStudentFormModalOpen(true);
            }}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Reminder Hub ({overdueFees.length + dueTodayFees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => exportFeeRecordsCSV(feeRecords, students)}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs transition-colors border border-zinc-700 cursor-pointer"
            title="Export Monthly Report (CSV)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Subtle background decorative watermark note */}
        <Music className="absolute -right-6 -bottom-6 w-48 h-48 text-zinc-800/20 pointer-events-none transform rotate-12" />
      </div>

      {/* 4 SIGNATURE EDITORIAL METRIC SURFACES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-[#111113] border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-2">
            Active Students
          </p>
          <h2 className="text-3xl font-serif tracking-tight text-zinc-100 group-hover:text-amber-400 transition-colors">
            <NumberCounter value={stats.activeStudents} />
          </h2>
          <p className="text-emerald-400 text-[10px] font-mono mt-2 flex items-center gap-1">
            <span>↑</span> {stats.totalStudents} total registrations
          </p>
        </div>

        {/* 2. Revenue (MTD) */}
        <div
          onClick={() => onNavigate('fees')}
          className="bg-[#111113] border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-2">
            Revenue (MTD)
          </p>
          <h2 className="text-3xl font-serif tracking-tight text-zinc-100 group-hover:text-emerald-400 transition-colors">
            <NumberCounter value={stats.totalCollected} prefix={settings.currencySymbol} />
          </h2>
          <p className="text-emerald-400 text-[10px] font-mono mt-2 flex items-center gap-1">
            <span>↑ {stats.collectionRate}% collection yield</span>
          </p>
        </div>

        {/* 3. Pending & Overdue Fees */}
        <div
          onClick={() => onNavigate('fees')}
          className="bg-[#111113] border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-2">
            Pending & Overdue
          </p>
          <h2 className="text-3xl font-serif tracking-tight text-rose-400 group-hover:text-rose-300 transition-colors">
            <NumberCounter value={stats.totalOverdue + stats.totalPending} prefix={settings.currencySymbol} />
          </h2>
          <p className="text-rose-400 text-[10px] font-mono mt-2">
            {overdueFees.length} overdue records
          </p>
        </div>

        {/* 4. Expiring Memberships */}
        <div
          onClick={() => onNavigate('memberships')}
          className="bg-[#111113] border border-amber-500/30 p-5 rounded-2xl cursor-pointer hover:border-amber-500/60 transition-all group relative overflow-hidden"
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mb-2">
            Expiring Memberships
          </p>
          <h2 className="text-3xl font-serif tracking-tight text-amber-500 group-hover:text-amber-400 transition-colors">
            {stats.expiringSoonMemberships < 10 ? `0${stats.expiringSoonMemberships}` : stats.expiringSoonMemberships}
          </h2>
          <p className="text-zinc-400 text-[10px] font-mono mt-2">
            Renewal needed in ≤ 10 days
          </p>
        </div>
      </section>

      {/* MAIN EDITORIAL GRID: 8 COLUMNS INSIGHTS + 4 COLUMNS REMINDER CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT 8 COLUMNS: Monthly Collection Insights & Health */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Monthly Collection Insights */}
          <section className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-serif italic text-amber-500">
                  Monthly Collection Insights
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Revenue stream analysis & billing target fulfillment for 2026
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportFeeRecordsCSV(feeRecords, students)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-[11px] font-medium text-zinc-300 transition-colors cursor-pointer"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('reports')}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-[11px] font-medium text-zinc-300 transition-colors cursor-pointer"
                >
                  Full Analytics →
                </button>
              </div>
            </div>

            {/* Visual Column Graph matching the Design Template */}
            <div className="h-64 flex items-end justify-between px-4 sm:px-8 pb-4 pt-6 gap-3 sm:gap-6 border-b border-zinc-800/80">
              {monthlyColumns.map((col, index) => (
                <div key={index} className="flex flex-col items-center gap-2 group flex-1">
                  <div className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {col.amount}
                  </div>
                  <div
                    className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 ${col.height} ${
                      col.active
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20'
                        : col.dashed
                        ? 'border border-dashed border-zinc-700 bg-zinc-900/40'
                        : 'bg-zinc-800 hover:bg-amber-500/50'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      col.active ? 'text-amber-500 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Insight Footnote */}
            <div className="pt-4 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Current Billing Cycle</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-800" />
                  <span>Historical Settlements</span>
                </span>
              </div>
              <span className="font-mono text-zinc-500 text-[11px]">
                Target: {formatCurrency(stats.totalCollected + stats.totalPending + stats.totalOverdue, settings.currencySymbol)}
              </span>
            </div>
          </section>

          {/* Recent Payment Ledger */}
          <section className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-serif italic text-zinc-200">
                  Recent Settlements
                </h3>
                <p className="text-xs text-zinc-500">Live verified transactions</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('fees')}
                className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentPaidFees.map((fee) => {
                const student = students.find((s) => s.id === fee.studentId);
                const course = courses.find((c) => c.id === student?.courseId);
                const batch = batches.find((b) => b.id === student?.batchId);

                return (
                  <div
                    key={fee.id}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {fee.studentName}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {fee.paymentMethod || 'UPI'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {fee.monthYear} • {fee.paymentDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {formatCurrency(fee.amount, settings.currencySymbol)}
                      </span>
                      {student && (
                        <button
                          type="button"
                          onClick={() => generatePaymentReceiptPDF(fee, student, course, batch, settings)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Download PDF Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT 4 COLUMNS: Reminder Center & Membership Pulse */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* REMINDER CENTER WITH LEFT-BORDER ACCENTS */}
          <section className="bg-[#0C0C0E] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800/80">
                <h3 className="text-xs uppercase tracking-widest font-mono font-semibold text-zinc-400">
                  Reminder Center
                </h3>
                <span className="w-5 h-5 bg-rose-500 text-zinc-950 text-[10px] flex items-center justify-center rounded-full font-bold">
                  {overdueFees.length + dueTodayFees.length}
                </span>
              </div>

              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {/* 1. Overdue Item */}
                {overdueFees.slice(0, 2).map((fee) => (
                  <div key={fee.id} className="bg-[#161618] border-l-2 border-rose-500 p-4 rounded-r-xl border border-r-zinc-800 border-t-zinc-800 border-b-zinc-800">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-bold text-zinc-200">{fee.studentName}</h4>
                      <span className="text-[9px] text-rose-400 font-bold uppercase font-mono tracking-wider">
                        Overdue
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {fee.monthYear} • {formatCurrency(fee.amount, settings.currencySymbol)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('reminders')}
                        className="flex-1 bg-amber-500 text-zinc-950 text-[10px] font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Send WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecordFee(fee)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Due Today Item */}
                {dueTodayFees.slice(0, 2).map((fee) => (
                  <div key={fee.id} className="bg-[#161618] border-l-2 border-amber-500 p-4 rounded-r-xl border border-r-zinc-800 border-t-zinc-800 border-b-zinc-800">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-bold text-zinc-200">{fee.studentName}</h4>
                      <span className="text-[9px] text-amber-500 font-bold uppercase font-mono tracking-wider">
                        Due Today
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {fee.monthYear} • {formatCurrency(fee.amount, settings.currencySymbol)}
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onNavigate('reminders')}
                        className="w-full border border-amber-500/40 text-amber-400 text-[10px] font-bold py-2 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        Notify via Mobile
                      </button>
                    </div>
                  </div>
                ))}

                {/* 3. Upcoming Item */}
                {upcomingFees.slice(0, 1).map((fee) => (
                  <div key={fee.id} className="bg-[#161618] border-l-2 border-zinc-700 p-4 rounded-r-xl opacity-80 border border-r-zinc-800 border-t-zinc-800 border-b-zinc-800">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-bold text-zinc-300">{fee.studentName}</h4>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase font-mono tracking-wider">
                        Upcoming
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {fee.monthYear} • {formatCurrency(fee.amount, settings.currencySymbol)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('reminders')}
              className="mt-4 pt-3 text-center text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold hover:text-amber-500 transition-colors cursor-pointer border-t border-zinc-800/80"
            >
              View All Reminders →
            </button>
          </section>

          {/* EDITORIAL GOLD GRADIENT BANNER: MEMBERSHIP PULSE */}
          <section className="bg-gradient-to-br from-amber-600 to-amber-900 rounded-3xl p-6 relative overflow-hidden shadow-xl text-zinc-950">
            <div className="relative z-10">
              <h4 className="text-base font-serif italic text-white mb-1">
                Membership Pulse
              </h4>
              <p className="text-xs text-white/80 mb-4 font-sans">
                Active pass retention is at 94% across all musical disciplines this term.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-amber-800 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-amber-800 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-amber-800 object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('memberships')}
                  className="py-1.5 px-3 bg-zinc-950 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Pass Registry →
                </button>
              </div>
            </div>
            <Music className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 transform rotate-12 pointer-events-none" />
          </section>
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        feeRecord={selectedFeeForPayment}
      />

      <StudentDetailModal
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        student={selectedStudentForDetail}
        onEditStudent={(s) => {
          setSelectedStudentForDetail(null);
          setStudentToEdit(s);
          setStudentFormModalOpen(true);
        }}
      />

      <StudentFormModal
        isOpen={studentFormModalOpen}
        onClose={() => setStudentFormModalOpen(false)}
        studentToEdit={studentToEdit}
      />
    </div>
  );
};


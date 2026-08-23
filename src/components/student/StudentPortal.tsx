import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDateFull, getDaysDifference, APP_TODAY } from '../../utils/dateUtils';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';
import { FeeRecord, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import {
  Music,
  Shield,
  CreditCard,
  Download,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Phone,
  LogOut,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const {
    currentUser,
    logout,
    students,
    courses,
    batches,
    membershipPlans,
    feeRecords,
    settings,
    darkMode,
    setDarkMode,
    getComputedFeeStatus,
    getComputedMembershipStatus,
    recordFeePayment,
    renewMembership,
    notifications,
  } = useApp();

  // Find the student profile corresponding to currentUser
  const student = students.find((s) => s.id === currentUser?.studentId) || students[0];

  const course = courses.find((c) => c.id === student?.courseId);
  const batch = batches.find((b) => b.id === student?.batchId);
  const plan = membershipPlans.find((p) => p.id === student?.planId);

  // Student fee records
  const myFees = feeRecords.filter((f) => f.studentId === student?.id);
  const latestFee = myFees[0];

  const computedFeeStatus = latestFee ? getComputedFeeStatus(latestFee) : 'PAID';
  const computedMemStatus = student ? getComputedMembershipStatus(student) : 'ACTIVE';

  const daysLeftInMem = student ? getDaysDifference(student.membershipEndDate, APP_TODAY) : 30;

  // Membership progress calculation
  const totalDays = student ? Math.max(1, getDaysDifference(student.membershipEndDate, student.membershipStartDate)) : 30;
  const daysElapsed = student ? Math.max(0, getDaysDifference(APP_TODAY, student.membershipStartDate)) : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

  // Online Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payFeeRecord, setPayFeeRecord] = useState<FeeRecord | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payTxId, setPayTxId] = useState('');

  // Membership Renewal Modal State
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(student?.planId || membershipPlans[0]?.id || '');
  const [renewMethod, setRenewMethod] = useState<PaymentMethod>('UPI');

  // Student notifications
  const studentNotifs = notifications.filter(
    (n) => n.targetRole === 'all' || (n.targetRole === 'student' && n.studentId === student?.id)
  );

  const handleOpenPay = (fee: FeeRecord) => {
    setPayFeeRecord(fee);
    setPayTxId('UPI-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    setPayModalOpen(true);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFeeRecord) return;
    recordFeePayment(payFeeRecord.id, payMethod, payTxId);
    setPayModalOpen(false);
  };

  const handleConfirmRenew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !selectedPlanId) return;
    renewMembership(
      student.id,
      selectedPlanId,
      renewMethod,
      'MEM-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    );
    setRenewalModalOpen(false);
  };

  const handleDownloadReceipt = (fee: FeeRecord) => {
    if (!student) return;
    generatePaymentReceiptPDF(fee, student, course, batch, settings);
  };

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        Student account details could not be found. Please contact administration.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-zinc-100 pb-16 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0C0C0E]/90 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20">
              <Music className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-serif italic text-base sm:text-lg tracking-tight text-zinc-100">
                {settings.instituteName}
              </h1>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                Student Self-Service Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Logout button */}
            <button
              type="button"
              onClick={logout}
              className="py-2 px-3.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* STUDENT PROFILE WELCOME BANNER */}
        <div className="p-6 bg-gradient-to-r from-[#18181B] via-[#111113] to-amber-950/30 border border-zinc-800 rounded-3xl text-zinc-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={student.avatar}
              alt={student.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/40 shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-zinc-100">
                  Welcome, <span className="text-amber-400">{student.fullName}</span>
                </h2>
                <Badge
                  type="status"
                  value={student.status === 'active' ? 'Active' : 'Inactive'}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5 flex-wrap font-mono">
                <span className="text-amber-400 font-semibold">
                  ID: {student.studentCode}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1 text-zinc-300 font-sans">
                  <Music className="w-3.5 h-3.5 text-amber-500" />
                  {course?.name}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1 text-zinc-300 font-sans">
                  <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                  {batch?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <a
              href={`https://wa.me/${settings.institutePhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Academy Desk</span>
            </a>
          </div>
        </div>

        {/* 2-COLUMN HERO METRICS: MEMBERSHIP STATUS & CURRENT FEE DUE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: MEMBERSHIP PASS HEALTH */}
          <div className="p-6 bg-[#111113] border border-zinc-800 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif italic text-zinc-100">
                      Membership Pass
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">{plan?.name || 'Academy Access'}</p>
                  </div>
                </div>
                <Badge type="membership" value={computedMemStatus} size="sm" />
              </div>

              <div className="py-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Remaining Validity:</span>
                  <span className="text-2xl font-serif text-zinc-100">
                    {daysLeftInMem < 0
                      ? `Expired ${Math.abs(daysLeftInMem)} days ago`
                      : daysLeftInMem === 0
                      ? 'Expires Today'
                      : `${daysLeftInMem} Days Left`}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      computedMemStatus === 'EXPIRED'
                        ? 'bg-rose-500'
                        : computedMemStatus === 'EXPIRING SOON' || computedMemStatus === 'EXPIRING TODAY'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Start: {student.membershipStartDate}</span>
                  <span>Expires: {student.membershipEndDate}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRenewalModalOpen(true)}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans"
            >
              <Sparkles className="w-4 h-4" />
              <span>Renew / Upgrade Pass</span>
            </button>
          </div>

          {/* CARD 2: CURRENT MONTH TUITION FEE */}
          <div className="p-6 bg-[#111113] border border-zinc-800 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif italic text-zinc-100">
                      Current Month Tuition
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">{latestFee?.monthYear || 'August 2026'}</p>
                  </div>
                </div>
                <Badge type="fee" value={computedFeeStatus} size="sm" />
              </div>

              <div className="py-4 space-y-1">
                <span className="text-xs text-zinc-400 font-mono block">Payable Tuition:</span>
                <div className="text-3xl font-serif text-zinc-100 tracking-tight">
                  {formatCurrency(latestFee ? latestFee.amount : student.monthlyFee, settings.currencySymbol)}
                  <span className="text-xs font-mono text-zinc-500 ml-1.5">/ month</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Due by {latestFee ? formatDateFull(latestFee.dueDate) : `${student.feeDueDay}th of month`}
                  </span>
                </div>
              </div>
            </div>

            {latestFee && computedFeeStatus !== 'PAID' ? (
              <button
                type="button"
                onClick={() => handleOpenPay(latestFee)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Fee Online (Instant Receipt)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tuition for current billing period is fully settled</span>
              </div>
            )}
          </div>
        </div>

        {/* BATCH & INSTRUCTOR SCHEDULE CARD */}
        <div className="p-6 bg-[#111113] border border-zinc-800 rounded-3xl shadow-sm">
          <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-500 mb-4">
            Academic Schedule & Faculty
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Enrolled Course</span>
              <span className="font-serif italic text-zinc-100 text-base block">
                {course?.name}
              </span>
              <span className="text-[11px] text-amber-500 font-mono block mt-1">{course?.duration}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Class Schedule</span>
              <span className="font-serif italic text-zinc-100 text-base block">
                {batch?.timeSlot}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono block mt-1">{batch?.name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Faculty Mentor</span>
              <span className="font-serif italic text-zinc-100 text-base block">
                {batch?.instructor}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono block mt-1">Faculty of {course?.instrument}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY & PDF RECEIPTS LEDGER */}
        <div className="bg-[#111113] border border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif italic text-zinc-100 tracking-tight">
                Payment History & Official Receipts
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                View all previous billing cycles, settled transactions, and download official PDF receipts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C0C0E] text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Invoice #</th>
                  <th className="py-4 px-4">Billing Month</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {myFees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-sans">
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  myFees.map((fee) => {
                    const status = getComputedFeeStatus(fee);

                    return (
                      <tr
                        key={fee.id}
                        className="hover:bg-zinc-900/60 transition-colors"
                      >
                        <td className="py-4 px-5 font-mono font-semibold text-amber-400 text-[11px]">
                          {fee.invoiceNumber}
                        </td>
                        <td className="py-4 px-4 font-serif text-zinc-200 text-sm">
                          {fee.monthYear}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-zinc-100">
                          {formatCurrency(fee.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-4 px-4 text-zinc-400 font-mono text-[11px]">
                          {formatDateFull(fee.dueDate)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge type="fee" value={status} size="sm" />
                        </td>
                        <td className="py-4 px-4 text-[11px] font-mono text-zinc-400">
                          {status === 'PAID' ? (
                            <div>
                              <span className="font-semibold text-emerald-400">
                                {fee.paymentMethod}
                              </span>
                              <span className="block text-[10px] text-zinc-500 font-mono">
                                {fee.paymentDate}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPay(fee)}
                              className="text-amber-400 font-bold hover:underline cursor-pointer font-sans text-xs"
                            >
                              Pay Now →
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {status === 'PAID' ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(fee)}
                              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                              title="Download PDF Receipt"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>PDF</span>
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[11px] font-mono italic">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* PAY FEE ONLINE MODAL */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        maxWidth="md"
        title="Pay Tuition Fee Online"
        subtitle={`Invoice: ${payFeeRecord?.invoiceNumber} • ${payFeeRecord?.monthYear}`}
      >
        <form onSubmit={handleConfirmPay} className="space-y-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Student:</span>
              <span className="font-bold text-zinc-100 font-sans">{student.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Discipline:</span>
              <span className="text-zinc-200 font-sans">{course?.name}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-zinc-800">
              <span className="text-zinc-400">Amount Due:</span>
              <span className="text-xl font-serif text-amber-400">
                {formatCurrency(payFeeRecord?.amount || 0, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              <option value="UPI">UPI / Google Pay / PhonePe / Paytm</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Bank Transfer">Net Banking (NEFT / IMPS)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Transaction / UPI Reference Number
            </label>
            <input
              type="text"
              value={payTxId}
              onChange={(e) => setPayTxId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Generate Receipt</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MEMBERSHIP RENEWAL MODAL */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        maxWidth="md"
        title="Renew Academy Pass"
        subtitle="Extend your academy access pass with instant confirmation"
      >
        <form onSubmit={handleConfirmRenew} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Membership Tier *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              {membershipPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.durationMonths} Mo) — ₹{p.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Payment Mode *
            </label>
            <select
              value={renewMethod}
              onChange={(e) => setRenewMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Bank Transfer">Net Banking</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setRenewalModalOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm & Renew</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

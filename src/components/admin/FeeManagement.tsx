import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { FeeRecord, FeeStatus } from '../../types';
import { formatCurrency, formatDateFull } from '../../utils/dateUtils';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';
import { exportFeeRecordsCSV } from '../../utils/exportUtils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { WhatsAppModal } from './WhatsAppModal';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const {
    feeRecords,
    students,
    courses,
    batches,
    settings,
    getComputedFeeStatus,
    createManualFee,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Modals
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRecord | null>(null);

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedFeeForWhatsapp, setSelectedFeeForWhatsapp] = useState<FeeRecord | null>(null);

  // Manual Invoice Modal
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState(students[0]?.id || '');
  const [manualMonth, setManualMonth] = useState('September 2026');
  const [manualAmount, setManualAmount] = useState<number>(3000);
  const [manualDueDate, setManualDueDate] = useState('2026-09-25');
  const [manualNotes, setManualNotes] = useState('');

  // Extract unique months
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    feeRecords.forEach((f) => set.add(f.monthYear));
    return Array.from(set);
  }, [feeRecords]);

  // Filtered fee records
  const filteredFees = useMemo(() => {
    return feeRecords.filter((f) => {
      const computedStatus = getComputedFeeStatus(f);

      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.studentName.toLowerCase().includes(q) ||
        f.invoiceNumber.toLowerCase().includes(q) ||
        (f.transactionId && f.transactionId.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Status
      if (statusFilter !== 'ALL' && computedStatus !== statusFilter) {
        return false;
      }

      // Month
      if (monthFilter !== 'ALL' && f.monthYear !== monthFilter) {
        return false;
      }

      return true;
    });
  }, [feeRecords, searchQuery, statusFilter, monthFilter, getComputedFeeStatus]);

  const handleRecordPayment = (fee: FeeRecord) => {
    setSelectedFeeForPayment(fee);
    setRecordPaymentModalOpen(true);
  };

  const handleOpenWhatsApp = (fee: FeeRecord) => {
    setSelectedFeeForWhatsapp(fee);
    setWhatsappModalOpen(true);
  };

  const handleDownloadReceipt = (fee: FeeRecord) => {
    const student = students.find((s) => s.id === fee.studentId);
    if (!student) return;
    const course = courses.find((c) => c.id === student.courseId);
    const batch = batches.find((b) => b.id === student.batchId);
    generatePaymentReceiptPDF(fee, student, course, batch, settings);
  };

  const handleCreateManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;
    createManualFee(manualStudentId, manualMonth, Number(manualAmount), manualDueDate, manualNotes);
    setManualInvoiceOpen(false);
  };

  // Summary counts
  const countPaid = feeRecords.filter((f) => getComputedFeeStatus(f) === 'PAID').length;
  const countUpcoming = feeRecords.filter((f) => getComputedFeeStatus(f) === 'UPCOMING').length;
  const countDueToday = feeRecords.filter((f) => getComputedFeeStatus(f) === 'DUE TODAY').length;
  const countOverdue = feeRecords.filter((f) => getComputedFeeStatus(f) === 'OVERDUE').length;

  const targetStudentForWhatsapp = students.find((s) => s.id === selectedFeeForWhatsapp?.studentId) || null;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="text-amber-500">Tuition & Fee</span> Ledger
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Automated due-date calculation engine with real-time settlements, PDF receipts, and WhatsApp dispatcher.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportFeeRecordsCSV(filteredFees, students)}
            className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setManualInvoiceOpen(true)}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Fee Invoice</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS PILLS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'PAID'
              ? 'bg-[#161618] border-emerald-500/80 ring-1 ring-emerald-500/30'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              PAID SETTLEMENTS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-serif text-zinc-100 mt-2">
            {countPaid}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Settled to ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'UPCOMING' ? 'ALL' : 'UPCOMING')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'UPCOMING'
              ? 'bg-[#161618] border-zinc-600 ring-1 ring-zinc-500/30'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              UPCOMING FEES
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          </div>
          <div className="text-2xl font-serif text-zinc-100 mt-2">
            {countUpcoming}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Scheduled due date</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'DUE TODAY' ? 'ALL' : 'DUE TODAY')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'DUE TODAY'
              ? 'bg-[#161618] border-amber-500 ring-1 ring-amber-500/30'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
              DUE TODAY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-serif text-amber-500 mt-2">
            {countDueToday}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Action required</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'OVERDUE'
              ? 'bg-[#161618] border-rose-500 ring-1 ring-rose-500/30'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">
              OVERDUE FEES
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="text-2xl font-serif text-rose-400 mt-2">
            {countOverdue}
          </div>
          <span className="text-[10px] text-rose-500/80 font-mono">Late payment alert</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 sm:p-5 bg-[#111113] border border-zinc-800 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, invoice (INV-..), transaction ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Month Filter */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Billing Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="DUE TODAY">DUE TODAY</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
        </div>
      </div>

      {/* FEE LEDGER TABLE */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C0C0E] text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-5">Invoice #</th>
                <th className="py-4 px-4">Student</th>
                <th className="py-4 px-4">Billing Month</th>
                <th className="py-4 px-4">Tuition Amount</th>
                <th className="py-4 px-4">Due Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Settlement Info</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                    No fee records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const status = getComputedFeeStatus(fee);
                  const student = students.find((s) => s.id === fee.studentId);

                  return (
                    <tr
                      key={fee.id}
                      className="hover:bg-zinc-900/60 transition-colors group"
                    >
                      {/* Invoice # */}
                      <td className="py-4 px-5 font-mono font-semibold text-zinc-200">
                        {fee.invoiceNumber}
                      </td>

                      {/* Student */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          {student?.avatar && (
                            <img
                              src={student.avatar}
                              alt={fee.studentName}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-bold text-zinc-100 block">
                              {fee.studentName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {student?.studentCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Month */}
                      <td className="py-4 px-4 font-medium text-zinc-300 font-mono text-[11px]">
                        {fee.monthYear}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-bold text-zinc-100 font-mono text-xs">
                        {formatCurrency(fee.amount, settings.currencySymbol)}
                        {fee.lateFee ? (
                          <span className="block text-[10px] text-rose-400 font-normal">
                            + {formatCurrency(fee.lateFee, settings.currencySymbol)} late fee
                          </span>
                        ) : null}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 text-zinc-300 font-mono text-[11px]">
                        {formatDateFull(fee.dueDate)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <Badge type="fee" value={status} size="sm" />
                      </td>

                      {/* Payment Method / Date */}
                      <td className="py-4 px-4 text-[11px] text-zinc-400">
                        {status === 'PAID' ? (
                          <div>
                            <span className="font-semibold text-emerald-400 font-mono text-[10px]">
                              {fee.paymentMethod || 'Settled'}
                            </span>
                            <span className="block text-[10px] text-zinc-500 font-mono">
                              {fee.paymentDate} • {fee.transactionId || 'Verified'}
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-zinc-500 font-sans">Pending Collection</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'PAID' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(fee)}
                                className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-800 transition-colors cursor-pointer"
                                title="Send WhatsApp Fee Reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRecordPayment(fee)}
                                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Collect</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(fee)}
                              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Download Official PDF Receipt"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-500" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        feeRecord={selectedFeeForPayment}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        student={targetStudentForWhatsapp}
        feeRecord={selectedFeeForWhatsapp}
        type={selectedFeeForWhatsapp?.status === 'OVERDUE' ? 'overdue' : 'fee'}
      />

      {/* Manual Invoice Creation Modal */}
      <Modal
        isOpen={manualInvoiceOpen}
        onClose={() => setManualInvoiceOpen(false)}
        maxWidth="md"
        title="Generate Fee Invoice"
        subtitle="Issue a tuition or event fee invoice to any enrolled student ledger"
      >
        <form onSubmit={handleCreateManualInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Student *
            </label>
            <select
              value={manualStudentId}
              onChange={(e) => {
                const sid = e.target.value;
                setManualStudentId(sid);
                const s = students.find((item) => item.id === sid);
                if (s) {
                  setManualAmount(s.monthlyFee);
                }
              }}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode} • ₹{s.monthlyFee}/mo)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Billing Month / Description *
              </label>
              <input
                type="text"
                value={manualMonth}
                onChange={(e) => setManualMonth(e.target.value)}
                placeholder="e.g. September 2026"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Amount ({settings.currencySymbol}) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="100"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Due Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={manualDueDate}
                onChange={(e) => setManualDueDate(e.target.value)}
                required
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Invoice Note / Memo
            </label>
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="e.g. Regular monthly tuition invoice"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setManualInvoiceOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Issue Invoice</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Student, FeeRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateFull, getDaysDifference, APP_TODAY } from '../../utils/dateUtils';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator';
import { WhatsAppModal } from './WhatsAppModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Music,
  Clock,
  Download,
  CreditCard,
  MessageSquare,
  Edit2,
  CheckCircle2,
  Shield,
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEditStudent: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEditStudent,
}) => {
  const {
    courses,
    batches,
    membershipPlans,
    getStudentFeeRecords,
    getComputedFeeStatus,
    getComputedMembershipStatus,
    settings,
  } = useApp();

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappType, setWhatsappType] = useState<'fee' | 'overdue' | 'membership'>('fee');
  const [selectedFeeForWhatsapp, setSelectedFeeForWhatsapp] = useState<FeeRecord | null>(null);

  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRecord | null>(null);

  if (!student) return null;

  const course = courses.find((c) => c.id === student.courseId);
  const batch = batches.find((b) => b.id === student.batchId);
  const plan = membershipPlans.find((p) => p.id === student.planId);
  const studentFees = getStudentFeeRecords(student.id);

  const memStatus = getComputedMembershipStatus(student);
  const daysLeft = getDaysDifference(student.membershipEndDate, APP_TODAY);

  // Calculate membership progress %
  const totalDays = Math.max(1, getDaysDifference(student.membershipEndDate, student.membershipStartDate));
  const daysElapsed = Math.max(0, getDaysDifference(APP_TODAY, student.membershipStartDate));
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

  // Latest fee calculation
  const latestFee = studentFees[0];
  const computedFeeStatus = latestFee ? getComputedFeeStatus(latestFee) : 'UPCOMING';

  const handleOpenWhatsApp = (type: 'fee' | 'overdue' | 'membership', fee?: FeeRecord) => {
    setWhatsappType(type);
    setSelectedFeeForWhatsapp(fee || latestFee || null);
    setWhatsappModalOpen(true);
  };

  const handleRecordFee = (fee: FeeRecord) => {
    setSelectedFeeForPayment(fee);
    setRecordPaymentModalOpen(true);
  };

  const handleDownloadReceipt = (fee: FeeRecord) => {
    generatePaymentReceiptPDF(fee, student, course, batch, settings);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl" showCloseButton={true}>
        <div className="space-y-6 font-sans">
          {/* Header Profile Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-2xl font-serif italic text-zinc-100 tracking-tight">
                    {student.fullName}
                  </h3>
                  <Badge
                    type="status"
                    value={student.status === 'active' ? 'Active' : 'Inactive'}
                    size="sm"
                  />
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-amber-400">
                    {student.studentCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                  <span className="flex items-center gap-1 font-sans text-zinc-300">
                    <Music className="w-3.5 h-3.5 text-amber-500" />
                    {course?.name || 'General Music'}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 font-sans text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                    {batch?.name || 'Standard Batch'}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditStudent(student);
                }}
                className="flex-1 sm:flex-none py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(computedFeeStatus === 'OVERDUE' ? 'overdue' : 'fee', latestFee)}
                className="flex-1 sm:flex-none py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Monthly Tuition Fee Card */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Tuition Fee
                </span>
                <Badge type="fee" value={computedFeeStatus} size="sm" />
              </div>
              <div className="text-2xl font-serif text-zinc-100">
                {formatCurrency(student.monthlyFee, settings.currencySymbol)}
                <span className="text-xs font-mono text-zinc-500 ml-1">/mo</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-zinc-500" />
                Due every {student.feeDueDay}th of month
              </div>
            </div>

            {/* Membership Status Card */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Membership
                </span>
                <Badge type="membership" value={memStatus} size="sm" />
              </div>
              <div className="text-base font-serif italic text-zinc-100 truncate">
                {plan?.name || 'Academy Pass'}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                {daysLeft < 0
                  ? `Expired ${Math.abs(daysLeft)} days ago`
                  : daysLeft === 0
                  ? 'Expires today'
                  : `${daysLeft} days remaining`}
              </div>
            </div>

            {/* Joining Date & Contact */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                Enrolled Since
              </span>
              <div className="text-base font-serif italic text-zinc-100">
                {formatDateFull(student.joiningDate)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 truncate font-mono">
                Parent: {student.parentName || 'Self Enrolled'}
              </div>
            </div>
          </div>

          {/* Membership Progress Bar */}
          <div className="p-4 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Shield className="w-4 h-4" />
                <span>{plan?.name} Duration</span>
              </div>
              <span className="text-zinc-400 text-[11px]">
                {student.membershipStartDate} → {student.membershipEndDate}
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  memStatus === 'EXPIRED'
                    ? 'bg-rose-500'
                    : memStatus === 'EXPIRING SOON' || memStatus === 'EXPIRING TODAY'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Progress: {progressPercent}% of cycle</span>
              <button
                type="button"
                onClick={() => handleOpenWhatsApp('membership')}
                className="text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
              >
                Send Renewal Reminder
              </button>
            </div>
          </div>

          {/* Contact Details Breakdown */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2.5 text-xs font-mono">
            <h4 className="font-mono uppercase tracking-wider text-zinc-500 text-[10px]">
              Student Contact & Location
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>Mobile: {student.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span className="truncate">Email: {student.email}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">Address: {student.address}</span>
              </div>
              {student.notes && (
                <div className="sm:col-span-2 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-300 font-sans">
                  <span className="font-bold block mb-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-400">Faculty Notes</span>
                  {student.notes}
                </div>
              )}
            </div>
          </div>

          {/* Fee & Payment Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif italic text-zinc-100 text-base">
                Fee Records & Invoices ({studentFees.length})
              </h4>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C0C0E] text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Billing Month</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Payment Info</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {studentFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                        No fee invoices recorded yet for this student.
                      </td>
                    </tr>
                  ) : (
                    studentFees.map((fee) => {
                      const status = getComputedFeeStatus(fee);
                      return (
                        <tr
                          key={fee.id}
                          className="hover:bg-zinc-900/60 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-serif text-zinc-200">
                            {fee.monthYear}
                            <span className="block text-[10px] text-zinc-500 font-mono">
                              #{fee.invoiceNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                            {formatDateFull(fee.dueDate)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">
                            {formatCurrency(fee.amount, settings.currencySymbol)}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge type="fee" value={status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-[11px] font-mono text-zinc-400">
                            {status === 'PAID' ? (
                              <div>
                                <span className="text-emerald-400 font-medium">
                                  {fee.paymentMethod}
                                </span>
                                <span className="block text-[10px] text-zinc-500 font-mono">
                                  {fee.paymentDate}
                                </span>
                              </div>
                            ) : (
                              <span className="italic text-zinc-600">Unsettled</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {status !== 'PAID' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRecordFee(fee)}
                                  className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Collect</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(fee)}
                                  className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Download Official PDF Receipt"
                                >
                                  <Download className="w-3 h-3 text-amber-400" />
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
        </div>
      </Modal>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        student={student}
        feeRecord={selectedFeeForWhatsapp}
        type={whatsappType}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        feeRecord={selectedFeeForPayment}
      />
    </>
  );
};

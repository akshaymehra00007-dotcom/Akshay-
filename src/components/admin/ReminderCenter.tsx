import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { FeeRecord, Student } from '../../types';
import { formatCurrency, formatDateFull, getDaysDifference, APP_TODAY } from '../../utils/dateUtils';
import { WhatsAppModal } from './WhatsAppModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import {
  Send,
  AlertCircle,
  Clock,
  Calendar,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  Zap,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react';

export const ReminderCenter: React.FC = () => {
  const {
    students,
    feeRecords,
    courses,
    membershipPlans,
    settings,
    getComputedFeeStatus,
    getComputedMembershipStatus,
  } = useApp();

  const [activeBucket, setActiveBucket] = useState<
    'overdue_fees' | 'due_today_fees' | 'upcoming_fees' | 'expiring_mem' | 'expired_mem'
  >('overdue_fees');

  // WhatsApp modal state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [targetFee, setTargetFee] = useState<FeeRecord | null>(null);
  const [whatsappType, setWhatsappType] = useState<'fee' | 'overdue' | 'membership'>('overdue');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeRecord | null>(null);

  // Group Fee Records
  const overdueFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'OVERDUE');
  const dueTodayFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'DUE TODAY');
  const upcomingFees = feeRecords.filter((f) => getComputedFeeStatus(f) === 'UPCOMING');

  // Group Memberships
  const expiringSoonStudents = students.filter(
    (s) =>
      getComputedMembershipStatus(s) === 'EXPIRING SOON' ||
      getComputedMembershipStatus(s) === 'EXPIRING TODAY'
  );
  const expiredStudents = students.filter(
    (s) => getComputedMembershipStatus(s) === 'EXPIRED'
  );

  const handleOpenWhatsAppForFee = (fee: FeeRecord, type: 'fee' | 'overdue') => {
    const student = students.find((s) => s.id === fee.studentId);
    if (!student) return;
    setTargetStudent(student);
    setTargetFee(fee);
    setWhatsappType(type);
    setWhatsappModalOpen(true);
  };

  const handleOpenWhatsAppForMembership = (student: Student) => {
    setTargetStudent(student);
    setTargetFee(null);
    setWhatsappType('membership');
    setWhatsappModalOpen(true);
  };

  const handleCollectFee = (fee: FeeRecord) => {
    setSelectedFeeForPayment(fee);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="p-6 bg-[#111113] border border-zinc-800 rounded-2xl text-zinc-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Communication Engine</span>
          </div>
          <h2 className="text-2xl font-serif italic tracking-tight text-zinc-100">
            Automated WhatsApp Dispatch
          </h2>
          <p className="text-xs font-mono text-zinc-400 max-w-xl mt-1">
            Dispatch personalized WhatsApp reminders, fee collection notices, and membership renewal invitations with 1-click.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Total Dispatches Queued</span>
            <span className="text-3xl font-serif text-amber-400">
              {overdueFees.length + dueTodayFees.length + expiringSoonStudents.length}
            </span>
          </div>
        </div>
      </div>

      {/* 5-CATEGORY FILTER BUTTON TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        {/* 1. Overdue Payments */}
        <button
          type="button"
          onClick={() => setActiveBucket('overdue_fees')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeBucket === 'overdue_fees'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-md'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Overdue Fees
            </span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-serif text-rose-400 mt-1">
            {overdueFees.length}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Immediate dispatch
          </span>
        </button>

        {/* 2. Payment Due Today */}
        <button
          type="button"
          onClick={() => setActiveBucket('due_today_fees')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeBucket === 'due_today_fees'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Due Today
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif text-amber-400 mt-1">
            {dueTodayFees.length}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Maturing today
          </span>
        </button>

        {/* 3. Upcoming Payments */}
        <button
          type="button"
          onClick={() => setActiveBucket('upcoming_fees')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeBucket === 'upcoming_fees'
              ? 'bg-zinc-800/80 border-amber-400/80 shadow-md'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
              Upcoming
            </span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-serif text-zinc-100 mt-1">
            {upcomingFees.length}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Advance notice
          </span>
        </button>

        {/* 4. Membership Expiring Soon */}
        <button
          type="button"
          onClick={() => setActiveBucket('expiring_mem')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeBucket === 'expiring_mem'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Expiring
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif text-amber-400 mt-1">
            {expiringSoonStudents.length}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Expires in ≤10 days
          </span>
        </button>

        {/* 5. Expired Memberships */}
        <button
          type="button"
          onClick={() => setActiveBucket('expired_mem')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeBucket === 'expired_mem'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-md'
              : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Expired
            </span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-serif text-rose-400 mt-1">
            {expiredStudents.length}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Lapsed membership
          </span>
        </button>
      </div>

      {/* ACTIVE BUCKET CONTENT LIST */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Bucket Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-serif italic text-zinc-100">
              {activeBucket === 'overdue_fees' && `Overdue Fee Accounts (${overdueFees.length})`}
              {activeBucket === 'due_today_fees' && `Maturing Fees Due Today (${dueTodayFees.length})`}
              {activeBucket === 'upcoming_fees' && `Upcoming Billing Cycle (${upcomingFees.length})`}
              {activeBucket === 'expiring_mem' && `Memberships Expiring Soon (${expiringSoonStudents.length})`}
              {activeBucket === 'expired_mem' && `Expired Memberships Requiring Renewal (${expiredStudents.length})`}
            </h3>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">
              Review and trigger pre-formatted WhatsApp dispatches with verified recipient payload.
            </p>
          </div>
        </div>

        {/* List of Records in Current Bucket */}
        <div className="divide-y divide-zinc-800/80 font-mono">
          {/* OVERDUE FEES LIST */}
          {activeBucket === 'overdue_fees' && (
            overdueFees.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-zinc-300">
                  No overdue fees recorded.
                </p>
              </div>
            ) : (
              overdueFees.map((fee) => {
                const student = students.find((s) => s.id === fee.studentId);
                const daysOverdue = Math.abs(getDaysDifference(fee.dueDate, APP_TODAY));

                return (
                  <div
                    key={fee.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      {student?.avatar && (
                        <img
                          src={student.avatar}
                          alt={fee.studentName}
                          className="w-11 h-11 rounded-full object-cover border border-rose-500/40 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100 font-sans">
                            {fee.studentName}
                          </h4>
                          <Badge type="fee" value="OVERDUE" size="sm" />
                          <span className="text-[10px] text-rose-400">
                            ({daysOverdue} days overdue)
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>Month: {fee.monthYear}</span>
                          <span>•</span>
                          <span>Due: {formatDateFull(fee.dueDate)}</span>
                          <span>•</span>
                          <span>{student?.mobile}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Pending Tuition</span>
                        <span className="text-base font-serif text-zinc-100">
                          {formatCurrency(fee.amount, settings.currencySymbol)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForFee(fee, 'overdue')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-950" />
                        <span>Send WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCollectFee(fee)}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer border border-zinc-700"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* DUE TODAY FEES LIST */}
          {activeBucket === 'due_today_fees' && (
            dueTodayFees.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-zinc-300">
                  No fees maturing on today's date ({formatDateFull(APP_TODAY)}).
                </p>
              </div>
            ) : (
              dueTodayFees.map((fee) => {
                const student = students.find((s) => s.id === fee.studentId);

                return (
                  <div
                    key={fee.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      {student?.avatar && (
                        <img
                          src={student.avatar}
                          alt={fee.studentName}
                          className="w-11 h-11 rounded-full object-cover border border-amber-500/40 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100 font-sans">
                            {fee.studentName}
                          </h4>
                          <Badge type="fee" value="DUE TODAY" size="sm" />
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>Month: {fee.monthYear}</span>
                          <span>•</span>
                          <span>{student?.mobile}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Due Amount</span>
                        <span className="text-base font-serif text-zinc-100">
                          {formatCurrency(fee.amount, settings.currencySymbol)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForFee(fee, 'fee')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-950" />
                        <span>Send WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCollectFee(fee)}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                      >
                        Collect Fee
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* UPCOMING FEES LIST */}
          {activeBucket === 'upcoming_fees' && (
            upcomingFees.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <p className="text-xs">No upcoming fee schedules pending.</p>
              </div>
            ) : (
              upcomingFees.map((fee) => {
                const student = students.find((s) => s.id === fee.studentId);
                const daysUntilDue = getDaysDifference(fee.dueDate, APP_TODAY);

                return (
                  <div
                    key={fee.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      {student?.avatar && (
                        <img
                          src={student.avatar}
                          alt={fee.studentName}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100 font-sans">
                            {fee.studentName}
                          </h4>
                          <Badge type="fee" value="UPCOMING" size="sm" />
                          <span className="text-[11px] text-zinc-400">
                            (Due in {daysUntilDue} days)
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>Month: {fee.monthYear}</span>
                          <span>•</span>
                          <span>Due: {formatDateFull(fee.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Tuition Fee</span>
                        <span className="text-base font-serif text-zinc-100">
                          {formatCurrency(fee.amount, settings.currencySymbol)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForFee(fee, 'fee')}
                        className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Advance Notice</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* MEMBERSHIP EXPIRING SOON */}
          {activeBucket === 'expiring_mem' && (
            expiringSoonStudents.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-zinc-300">
                  No memberships expiring within the next 10 days.
                </p>
              </div>
            ) : (
              expiringSoonStudents.map((student) => {
                const plan = membershipPlans.find((p) => p.id === student.planId);
                const course = courses.find((c) => c.id === student.courseId);
                const daysLeft = getDaysDifference(student.membershipEndDate, APP_TODAY);

                return (
                  <div
                    key={student.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={student.avatar}
                        alt={student.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100 font-sans">
                            {student.fullName}
                          </h4>
                          <Badge type="membership" value="EXPIRING SOON" size="sm" />
                          <span className="text-[11px] text-amber-400">
                            ({daysLeft === 0 ? 'Expires Today' : `${daysLeft} days remaining`})
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>{plan?.name}</span>
                          <span>•</span>
                          <span>{course?.name}</span>
                          <span>•</span>
                          <span>Expires: {formatDateFull(student.membershipEndDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForMembership(student)}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-950" />
                        <span>Send Renewal Notice</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* EXPIRED MEMBERSHIPS */}
          {activeBucket === 'expired_mem' && (
            expiredStudents.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-zinc-300">
                  No expired memberships in system.
                </p>
              </div>
            ) : (
              expiredStudents.map((student) => {
                const plan = membershipPlans.find((p) => p.id === student.planId);
                const daysOverdue = Math.abs(getDaysDifference(student.membershipEndDate, APP_TODAY));

                return (
                  <div
                    key={student.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={student.avatar}
                        alt={student.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-rose-500/40 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100 font-sans">
                            {student.fullName}
                          </h4>
                          <Badge type="membership" value="EXPIRED" size="sm" />
                          <span className="text-[11px] text-rose-400 font-semibold">
                            (Expired {daysOverdue} days ago)
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>{plan?.name}</span>
                          <span>•</span>
                          <span>Expired on: {formatDateFull(student.membershipEndDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForMembership(student)}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-950" />
                        <span>Re-enrollment Notice</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        student={targetStudent}
        feeRecord={targetFee}
        type={whatsappType}
      />

      {/* Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        feeRecord={selectedFeeForPayment}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { MembershipPlan, Student, PaymentMethod } from '../../types';
import { formatCurrency, formatDateFull, getDaysDifference, APP_TODAY } from '../../utils/dateUtils';
import { MembershipPlanModal } from './MembershipPlanModal';
import { WhatsAppModal } from './WhatsAppModal';
import { Modal } from '../common/Modal';
import {
  Shield,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Edit2,
  Sparkles,
  Calendar,
  CreditCard,
  Zap,
} from 'lucide-react';

export const MembershipManagement: React.FC = () => {
  const {
    membershipPlans,
    students,
    courses,
    settings,
    getComputedMembershipStatus,
    renewMembership,
  } = useApp();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<MembershipPlan | null>(null);

  // Renewal Modal
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [studentToRenew, setStudentToRenew] = useState<Student | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<PaymentMethod>('UPI');
  const [renewalTxRef, setRenewalTxRef] = useState('');

  // WhatsApp
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappStudent, setWhatsappStudent] = useState<Student | null>(null);

  // Active tab filter: 'all' | 'active' | 'expiring' | 'expired'
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  const filteredStudents = students.filter((s) => {
    const status = getComputedMembershipStatus(s);
    if (filterTab === 'active') return status === 'ACTIVE';
    if (filterTab === 'expiring') return status === 'EXPIRING SOON' || status === 'EXPIRING TODAY';
    if (filterTab === 'expired') return status === 'EXPIRED';
    return true;
  });

  const handleOpenRenewal = (student: Student) => {
    setStudentToRenew(student);
    setSelectedPlanId(student.planId || membershipPlans[0]?.id || '');
    setRenewalTxRef('MEM-' + Math.random().toString(36).substr(2, 8).toUpperCase());
    setRenewalModalOpen(true);
  };

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToRenew || !selectedPlanId) return;

    renewMembership(
      studentToRenew.id,
      selectedPlanId,
      renewalPaymentMethod,
      renewalTxRef
    );
    setRenewalModalOpen(false);
  };

  const handleOpenWhatsApp = (student: Student) => {
    setWhatsappStudent(student);
    setWhatsappModalOpen(true);
  };

  const selectedPlanDetails = membershipPlans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="text-amber-500">Membership Tiers</span> & Expirations
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Manage membership tiers, automated countdown tracking, and rapid student renewals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPlanToEdit(null);
            setPlanModalOpen(true);
          }}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Membership Plan</span>
        </button>
      </div>

      {/* MEMBERSHIP PLANS SHOWCASE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {membershipPlans.map((plan) => {
          const studentCount = students.filter((s) => s.planId === plan.id).length;

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-[#18181B] via-[#111113] to-amber-950/30 border-amber-500/50 shadow-xl'
                  : 'bg-[#111113] border-zinc-800 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-amber-500 text-zinc-950 font-mono font-bold text-[9px] uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      plan.isPopular ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {plan.durationMonths} Months Access
                  </span>
                  {!plan.isPopular && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlanToEdit(plan);
                        setPlanModalOpen(true);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3
                  className={`text-lg font-serif italic mb-1.5 ${
                    plan.isPopular ? 'text-amber-400' : 'text-zinc-100'
                  }`}
                >
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-2 my-3">
                  <span className="text-2xl font-serif text-zinc-100">
                    {formatCurrency(plan.price, settings.currencySymbol)}
                  </span>
                  {plan.discountPercent > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Save {plan.discountPercent}%
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  {plan.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
                <span className="text-[11px]">{studentCount} Enrolled</span>
                <span className="text-amber-500 text-[10px] uppercase tracking-wider font-bold">Tier Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* STUDENT MEMBERSHIP EXPIRY STATUS & RENEWAL HUB */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden">
        {/* Hub Header with Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-serif italic text-zinc-100 tracking-tight">
              Student Pass Status & Expiration Engine
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Automated expiry calculation: ≤10 days (Expiring Soon), Today (Expires Today), Over (Expired)
            </p>
          </div>

          <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-zinc-800 text-amber-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'active'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('expiring')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'expiring'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                  : 'text-amber-500 hover:text-amber-400'
              }`}
            >
              Expiring Soon
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('expired')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'expired'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Table of Memberships */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C0C0E] text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-4">Curriculum</th>
                <th className="py-4 px-4">Current Pass</th>
                <th className="py-4 px-4">Start Date</th>
                <th className="py-4 px-4">Expiry Date</th>
                <th className="py-4 px-4">Pass Status</th>
                <th className="py-4 px-4">Countdown</th>
                <th className="py-4 px-5 text-right">Renewal Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                    No students in this membership filter bucket.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const course = courses.find((c) => c.id === student.courseId);
                  const plan = membershipPlans.find((p) => p.id === student.planId);
                  const status = getComputedMembershipStatus(student);
                  const daysLeft = getDaysDifference(student.membershipEndDate, APP_TODAY);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatar}
                            alt={student.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-zinc-100 block">
                              {student.fullName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {student.studentCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-zinc-300">
                        {course?.name || 'General Music'}
                      </td>

                      <td className="py-4 px-4 font-semibold text-zinc-200 text-[11px]">
                        {plan?.name || 'Standard Pass'}
                      </td>

                      <td className="py-4 px-4 text-zinc-400 font-mono text-[11px]">
                        {student.membershipStartDate}
                      </td>

                      <td className="py-4 px-4 text-zinc-200 font-mono font-semibold text-[11px]">
                        {student.membershipEndDate}
                      </td>

                      <td className="py-4 px-4">
                        <Badge type="membership" value={status} size="sm" />
                      </td>

                      <td className="py-4 px-4 font-mono font-semibold text-[11px]">
                        {daysLeft < 0 ? (
                          <span className="text-rose-400">
                            {Math.abs(daysLeft)} days overdue
                          </span>
                        ) : daysLeft === 0 ? (
                          <span className="text-amber-400 animate-pulse font-bold">
                            Expires Today
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            {daysLeft} days remaining
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(student)}
                            className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-800 transition-colors cursor-pointer"
                            title="Send WhatsApp Renewal Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRenewal(student)}
                            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Renew</span>
                          </button>
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

      {/* Plan Edit Modal */}
      <MembershipPlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        planToEdit={planToEdit}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        student={whatsappStudent}
        type="membership"
      />

      {/* RENEWAL EXECUTION MODAL */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        maxWidth="md"
        title="Renew Student Membership"
        subtitle={`Student: ${studentToRenew?.fullName} (${studentToRenew?.studentCode})`}
      >
        <form onSubmit={handleConfirmRenewal} className="space-y-4">
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Current Expiry:</span>
              <span className="font-semibold text-zinc-200">
                {studentToRenew?.membershipEndDate ? formatDateFull(studentToRenew.membershipEndDate) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status:</span>
              <Badge
                type="membership"
                value={studentToRenew ? getComputedMembershipStatus(studentToRenew) : 'ACTIVE'}
                size="sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Select Renewal Plan *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              {membershipPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.durationMonths} Months) — ₹{p.price}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Payment Mode *
              </label>
              <select
                value={renewalPaymentMethod}
                onChange={(e) => setRenewalPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash at Academy Desk</option>
                <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Transaction Reference #
              </label>
              <input
                type="text"
                value={renewalTxRef}
                onChange={(e) => setRenewalTxRef(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Renewal Summary Card */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-300 block">
                Renewal Total Payable
              </span>
              <span className="text-[11px] text-amber-400/80 font-mono">
                Extends membership by {selectedPlanDetails?.durationMonths || 1} months
              </span>
            </div>
            <div className="text-2xl font-serif text-amber-400">
              {formatCurrency(selectedPlanDetails?.price || 0, settings.currencySymbol)}
            </div>
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
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm & Renew</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

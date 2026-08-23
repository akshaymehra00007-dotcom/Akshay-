import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayString, addMonths } from '../../utils/dateUtils';
import { User, Phone, Mail, MapPin, Calendar, Music, Clock, Shield, DollarSign, FileText, Check } from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const { courses, batches, membershipPlans, addStudent, updateStudent } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [joiningDate, setJoiningDate] = useState(getTodayString());
  const [monthlyFee, setMonthlyFee] = useState<number>(2500);
  const [planId, setPlanId] = useState('');
  const [membershipStartDate, setMembershipStartDate] = useState(getTodayString());
  const [membershipEndDate, setMembershipEndDate] = useState(addMonths(getTodayString(), 1));
  const [feeDueDay, setFeeDueDay] = useState<number>(25);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState('');
  const [parentName, setParentName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // Sample avatars for quick random pick
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  ];

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.fullName);
      setEmail(studentToEdit.email);
      setMobile(studentToEdit.mobile);
      setWhatsapp(studentToEdit.whatsapp);
      setAddress(studentToEdit.address);
      setCourseId(studentToEdit.courseId);
      setBatchId(studentToEdit.batchId);
      setJoiningDate(studentToEdit.joiningDate);
      setMonthlyFee(studentToEdit.monthlyFee);
      setPlanId(studentToEdit.planId);
      setMembershipStartDate(studentToEdit.membershipStartDate);
      setMembershipEndDate(studentToEdit.membershipEndDate);
      setFeeDueDay(studentToEdit.feeDueDay);
      setStatus(studentToEdit.status);
      setNotes(studentToEdit.notes || '');
      setAvatar(studentToEdit.avatar);
      setParentName(studentToEdit.parentName || '');
      setGuardianContact(studentToEdit.guardianContact || '');
    } else {
      // Defaults for new student
      setFullName('');
      setEmail('');
      setMobile('+91 98');
      setWhatsapp('+91 98');
      setAddress('');
      const defaultCourse = courses[0];
      setCourseId(defaultCourse ? defaultCourse.id : '');
      const defaultBatch = batches.find((b) => b.courseId === defaultCourse?.id) || batches[0];
      setBatchId(defaultBatch ? defaultBatch.id : '');
      setJoiningDate(getTodayString());
      setMonthlyFee(defaultCourse ? defaultCourse.feePerMonth : 2500);
      const defaultPlan = membershipPlans[0];
      setPlanId(defaultPlan ? defaultPlan.id : '');
      setMembershipStartDate(getTodayString());
      setMembershipEndDate(addMonths(getTodayString(), defaultPlan ? defaultPlan.durationMonths : 1));
      setFeeDueDay(25);
      setStatus('active');
      setNotes('');
      setAvatar(sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)]);
      setParentName('');
      setGuardianContact('');
    }
  }, [studentToEdit, isOpen, courses, batches, membershipPlans]);

  // When course changes, update fee and batch suggestion
  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const selectedCourse = courses.find((c) => c.id === newCourseId);
    if (selectedCourse) {
      setMonthlyFee(selectedCourse.feePerMonth);
    }
    const matchingBatch = batches.find((b) => b.courseId === newCourseId);
    if (matchingBatch) {
      setBatchId(matchingBatch.id);
    }
  };

  // When plan changes, update membershipEndDate
  const handlePlanChange = (newPlanId: string) => {
    setPlanId(newPlanId);
    const selectedPlan = membershipPlans.find((p) => p.id === newPlanId);
    if (selectedPlan) {
      setMembershipEndDate(addMonths(membershipStartDate, selectedPlan.durationMonths));
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setMembershipStartDate(newStartDate);
    const selectedPlan = membershipPlans.find((p) => p.id === planId);
    if (selectedPlan) {
      setMembershipEndDate(addMonths(newStartDate, selectedPlan.durationMonths));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const studentData: Omit<Student, 'id' | 'studentCode'> = {
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || mobile.trim(),
      address: address.trim(),
      courseId,
      batchId,
      joiningDate,
      monthlyFee: Number(monthlyFee),
      planId,
      membershipStartDate,
      membershipEndDate,
      feeDueDay: Number(feeDueDay),
      status,
      notes: notes.trim() || undefined,
      avatar: avatar || sampleAvatars[0],
      parentName: parentName.trim() || undefined,
      guardianContact: guardianContact.trim() || undefined,
    };

    if (studentToEdit) {
      updateStudent(studentToEdit.id, studentData);
    } else {
      addStudent(studentData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={studentToEdit ? 'Edit Student Profile' : 'Enroll New Music Student'}
      subtitle="Configure academic enrollment, membership duration, and fee parameters"
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans">
        {/* Avatar Selector Strip */}
        <div className="flex items-center gap-3 p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <img
            src={avatar}
            alt="Current avatar"
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0 shadow-md"
          />
          <div className="text-xs font-mono">
            <span className="text-zinc-400 block mb-1 text-[10px] uppercase tracking-wider">
              Select Avatar:
            </span>
            <div className="flex items-center gap-2">
              {sampleAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    avatar === url ? 'border-amber-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          {/* Full Name */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Mobile Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              WhatsApp Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Course */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Music Course *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                <Music className="w-4 h-4" />
              </div>
              <select
                value={courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (₹{c.feePerMonth}/mo)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Batch & Schedule *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400/80">
                <Clock className="w-4 h-4" />
              </div>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.timeSlot})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Tuition Fee */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Monthly Tuition Fee (₹) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="500"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs font-bold"
              />
            </div>
          </div>

          {/* Monthly Due Day */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Monthly Fee Due Day (1 - 28) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="1"
                max="28"
                value={feeDueDay}
                onChange={(e) => setFeeDueDay(Number(e.target.value))}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Membership Plan */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Membership Plan *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                <Shield className="w-4 h-4" />
              </div>
              <select
                value={planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              >
                {membershipPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationMonths} Mo - ₹{p.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Enrollment Date *
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

          {/* Membership Start */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Membership Start Date
            </label>
            <input
              type="date"
              value={membershipStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

          {/* Membership End */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Membership Expiry Date
            </label>
            <input
              type="date"
              value={membershipEndDate}
              onChange={(e) => setMembershipEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

          {/* Student Status */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Student Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            >
              <option value="active">Active Student</option>
              <option value="inactive">Inactive / Paused</option>
            </select>
          </div>

          {/* Parent / Guardian */}
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Parent / Guardian Name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Residential Address
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-zinc-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, Street, Area, City & Pincode"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>

          {/* Faculty Notes */}
          <div className="sm:col-span-2">
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Faculty Academic Notes & Assessment
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-zinc-500">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Trinity Grade 3 candidate, working on Chopin Waltz in A minor."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{studentToEdit ? 'Save Changes' : 'Enroll Student'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

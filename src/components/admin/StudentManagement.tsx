import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Student } from '../../types';
import { formatCurrency, formatDate } from '../../utils/dateUtils';
import { exportStudentsCSV } from '../../utils/exportUtils';
import { StudentFormModal } from './StudentFormModal';
import { StudentDetailModal } from './StudentDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { WhatsAppModal } from './WhatsAppModal';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  Music,
  Clock,
  Phone,
  LayoutGrid,
  List,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const {
    students,
    courses,
    batches,
    membershipPlans,
    deleteStudent,
    getComputedFeeStatus,
    getComputedMembershipStatus,
    getStudentFeeRecords,
    settings,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // WhatsApp quick modal
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappStudent, setWhatsappStudent] = useState<Student | null>(null);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const course = courses.find((c) => c.id === s.courseId);
      const batch = batches.find((b) => b.id === s.batchId);
      const fees = getStudentFeeRecords(s.id);
      const latestFee = fees[0];
      const feeStatus = latestFee ? getComputedFeeStatus(latestFee) : 'UPCOMING';
      const memStatus = getComputedMembershipStatus(s);

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        s.whatsapp.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        course?.name.toLowerCase().includes(q) ||
        batch?.name.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Course Filter
      if (courseFilter !== 'ALL' && s.courseId !== courseFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'inactive' && s.status !== 'inactive') return false;
      if (statusFilter === 'expiring' && memStatus !== 'EXPIRING SOON' && memStatus !== 'EXPIRING TODAY') return false;
      if (statusFilter === 'expired' && memStatus !== 'EXPIRED') return false;

      // Fee Status Filter
      if (feeStatusFilter !== 'ALL') {
        if (feeStatus !== feeStatusFilter) return false;
      }

      return true;
    });
  }, [
    students,
    courses,
    batches,
    searchQuery,
    courseFilter,
    statusFilter,
    feeStatusFilter,
    getStudentFeeRecords,
    getComputedFeeStatus,
    getComputedMembershipStatus,
  ]);

  const handleOpenWhatsApp = (student: Student) => {
    setWhatsappStudent(student);
    setWhatsappModalOpen(true);
  };

  const handleExportCSV = () => {
    exportStudentsCSV(filteredStudents, courses, batches);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Enrolling button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="text-amber-500">Student Directory</span> & Profiles
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Manage student registrations, instrument curricula, batch schedules, and fee ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStudentToEdit(null);
              setFormModalOpen(true);
            }}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND MULTI-FILTER TOOLBAR */}
      <div className="p-4 sm:p-5 bg-[#111113] border border-zinc-800 rounded-3xl space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, code (SMA-..), mobile, course, batch..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-amber-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-amber-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Filters:</span>
          </div>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
          >
            <option value="ALL">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Membership Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
          >
            <option value="ALL">All Pass Status</option>
            <option value="active">Active Passes</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired Passes</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Fee Status Filter */}
          <select
            value={feeStatusFilter}
            onChange={(e) => setFeeStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
          >
            <option value="ALL">All Fee Status</option>
            <option value="PAID">PAID</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="DUE TODAY">DUE TODAY</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>

          {/* Clear Filters Button */}
          {(courseFilter !== 'ALL' || statusFilter !== 'ALL' || feeStatusFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCourseFilter('ALL');
                setStatusFilter('ALL');
                setFeeStatusFilter('ALL');
              }}
              className="text-amber-500 hover:underline font-mono text-[11px] uppercase tracking-wider ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* STUDENTS COUNT SUMMARY */}
      <div className="text-[11px] text-zinc-500 px-1 font-mono uppercase tracking-wider">
        Showing {filteredStudents.length} of {students.length} enrolled students
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C0C0E] text-zinc-400 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Student</th>
                  <th className="py-4 px-4">Curriculum & Batch</th>
                  <th className="py-4 px-4">Monthly Fee</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4">Fee Status</th>
                  <th className="py-4 px-4">Pass Status</th>
                  <th className="py-4 px-4">Expiry</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                      No students found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const course = courses.find((c) => c.id === student.courseId);
                    const batch = batches.find((b) => b.id === student.batchId);
                    const plan = membershipPlans.find((p) => p.id === student.planId);
                    const fees = getStudentFeeRecords(student.id);
                    const latestFee = fees[0];
                    const feeStatus = latestFee ? getComputedFeeStatus(latestFee) : 'UPCOMING';
                    const memStatus = getComputedMembershipStatus(student);

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-zinc-900/60 transition-colors group"
                      >
                        {/* Student Avatar & Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              alt={student.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                            />
                            <div>
                              <div
                                onClick={() => setDetailModalStudent(student)}
                                className="font-bold text-zinc-100 hover:text-amber-400 cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{student.fullName}</span>
                                {student.status === 'inactive' && (
                                  <span className="text-[10px] text-zinc-500 font-normal">
                                    (Inactive)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {student.studentCode} • {student.mobile}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Course & Batch */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-200">
                            {course?.name || 'General Music'}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[160px] font-mono">
                            {batch?.name || 'Standard'}
                          </div>
                        </td>

                        {/* Monthly Tuition Fee */}
                        <td className="py-4 px-4 font-bold text-zinc-100 font-mono">
                          {formatCurrency(student.monthlyFee, settings.currencySymbol)}
                        </td>

                        {/* Fee Due Date */}
                        <td className="py-4 px-4 text-zinc-300 font-mono text-[11px]">
                          {student.feeDueDay}th of month
                        </td>

                        {/* Computed Fee Status */}
                        <td className="py-4 px-4">
                          <Badge type="fee" value={feeStatus} size="sm" />
                        </td>

                        {/* Membership Plan */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-zinc-300 block truncate max-w-[140px] text-[11px]">
                            {plan?.name || 'Standard Pass'}
                          </span>
                          <div className="mt-1">
                            <Badge type="membership" value={memStatus} size="sm" />
                          </div>
                        </td>

                        {/* Membership Expiry Date */}
                        <td className="py-4 px-4 text-zinc-400 font-mono text-[11px]">
                          {formatDate(student.membershipEndDate)}
                        </td>

                        {/* Row Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(student)}
                              className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-800 transition-colors cursor-pointer"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDetailModalStudent(student)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="View Student 360"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setStudentToEdit(student);
                                setFormModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentToDelete(student)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const course = courses.find((c) => c.id === student.courseId);
            const batch = batches.find((b) => b.id === student.batchId);
            const plan = membershipPlans.find((p) => p.id === student.planId);
            const fees = getStudentFeeRecords(student.id);
            const latestFee = fees[0];
            const feeStatus = latestFee ? getComputedFeeStatus(latestFee) : 'UPCOMING';
            const memStatus = getComputedMembershipStatus(student);

            return (
              <div
                key={student.id}
                className="p-5 bg-[#111113] border border-zinc-800 hover:border-zinc-700 rounded-3xl shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
                      />
                      <div>
                        <h4
                          onClick={() => setDetailModalStudent(student)}
                          className="font-serif italic text-base text-zinc-100 hover:text-amber-400 cursor-pointer"
                        >
                          {student.fullName}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {student.studentCode}
                        </span>
                      </div>
                    </div>
                    <Badge type="fee" value={feeStatus} size="sm" />
                  </div>

                  <div className="space-y-2.5 text-xs text-zinc-300 py-3 border-y border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Music className="w-3.5 h-3.5 text-amber-500" />
                        Curriculum:
                      </span>
                      <span className="font-semibold text-zinc-200 truncate max-w-[140px]">
                        {course?.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        Batch:
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300 truncate max-w-[140px]">
                        {batch?.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Monthly Fee:</span>
                      <span className="font-bold text-zinc-100 font-mono">
                        {formatCurrency(student.monthlyFee, settings.currencySymbol)}
                        <span className="text-[10px] font-normal text-zinc-500"> (Due {student.feeDueDay}th)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Pass Plan:</span>
                      <div className="text-right">
                        <span className="font-semibold block truncate max-w-[120px] text-zinc-300 text-[11px]">
                          {plan?.name}
                        </span>
                        <div className="mt-0.5">
                          <Badge type="membership" value={memStatus} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(student)}
                    className="flex-1 py-2 px-2.5 bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailModalStudent(student)}
                    className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Form Modal (Add / Edit) */}
      <StudentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        studentToEdit={studentToEdit}
      />

      {/* Student 360 Detail Modal */}
      <StudentDetailModal
        isOpen={!!detailModalStudent}
        onClose={() => setDetailModalStudent(null)}
        student={detailModalStudent}
        onEditStudent={(s) => {
          setDetailModalStudent(null);
          setStudentToEdit(s);
          setFormModalOpen(true);
        }}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        student={whatsappStudent}
        type="fee"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        title="Delete Student Record?"
        message={`Are you sure you want to remove ${studentToDelete?.fullName}? All associated fee records and invoices will be deleted.`}
        confirmLabel="Delete Record"
        isDestructive={true}
      />
    </div>
  );
};

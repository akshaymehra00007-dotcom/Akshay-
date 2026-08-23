import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, Batch } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Music, Clock, Plus, Edit2, Trash2, Users, DollarSign, Sparkles } from 'lucide-react';

export const CoursesAndBatches: React.FC = () => {
  const { courses, batches, students, settings, addCourse, updateCourse, deleteCourse, addBatch, updateBatch, deleteBatch } = useApp();

  // Course modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseInstrument, setCourseInstrument] = useState('');
  const [courseFee, setCourseFee] = useState<number>(2500);
  const [courseDuration, setCourseDuration] = useState('6 Months');
  const [courseDescription, setCourseDescription] = useState('');

  // Batch modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);
  const [batchCourseId, setBatchCourseId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchTimeSlot, setBatchTimeSlot] = useState('');
  const [batchInstructor, setBatchInstructor] = useState('');
  const [batchCapacity, setBatchCapacity] = useState<number>(10);

  // Deletion confirm state
  const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'batch'; id: string; name: string } | null>(null);

  const handleOpenAddCourse = () => {
    setCourseToEdit(null);
    setCourseName('');
    setCourseInstrument('');
    setCourseFee(2500);
    setCourseDuration('6 Months');
    setCourseDescription('');
    setCourseModalOpen(true);
  };

  const handleOpenEditCourse = (c: Course) => {
    setCourseToEdit(c);
    setCourseName(c.name);
    setCourseInstrument(c.instrument);
    setCourseFee(c.feePerMonth);
    setCourseDuration(c.duration);
    setCourseDescription(c.description);
    setCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseToEdit) {
      updateCourse(courseToEdit.id, {
        name: courseName.trim(),
        instrument: courseInstrument.trim(),
        feePerMonth: Number(courseFee),
        duration: courseDuration.trim(),
        description: courseDescription.trim(),
      });
    } else {
      addCourse({
        name: courseName.trim(),
        instrument: courseInstrument.trim(),
        feePerMonth: Number(courseFee),
        duration: courseDuration.trim(),
        description: courseDescription.trim(),
      });
    }
    setCourseModalOpen(false);
  };

  const handleOpenAddBatch = (defaultCourseId?: string) => {
    setBatchToEdit(null);
    setBatchCourseId(defaultCourseId || courses[0]?.id || '');
    setBatchName('');
    setBatchTimeSlot('Tue & Thu • 5:00 PM - 6:00 PM');
    setBatchInstructor('Prof. Alex Rivera');
    setBatchCapacity(10);
    setBatchModalOpen(true);
  };

  const handleOpenEditBatch = (b: Batch) => {
    setBatchToEdit(b);
    setBatchCourseId(b.courseId);
    setBatchName(b.name);
    setBatchTimeSlot(b.timeSlot);
    setBatchInstructor(b.instructor);
    setBatchCapacity(b.maxCapacity);
    setBatchModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchToEdit) {
      updateBatch(batchToEdit.id, {
        courseId: batchCourseId,
        name: batchName.trim(),
        timeSlot: batchTimeSlot.trim(),
        instructor: batchInstructor.trim(),
        maxCapacity: Number(batchCapacity),
      });
    } else {
      addBatch({
        courseId: batchCourseId,
        name: batchName.trim(),
        timeSlot: batchTimeSlot.trim(),
        instructor: batchInstructor.trim(),
        maxCapacity: Number(batchCapacity),
      });
    }
    setBatchModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif italic text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Music className="w-5 h-5 text-amber-500" />
            <span>Curriculum & Batch Schedules</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Manage instructional courses, studio schedules, and faculty assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            type="button"
            onClick={() => handleOpenAddBatch()}
            className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-800"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Batch</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddCourse}
            className="py-2 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* COURSES LIST CARDS */}
      <div className="space-y-4">
        {courses.map((course) => {
          const courseBatches = batches.filter((b) => b.courseId === course.id);
          const studentCount = students.filter((s) => s.courseId === course.id).length;

          return (
            <div
              key={course.id}
              className="p-5 bg-[#111113] border border-zinc-800 rounded-2xl shadow-sm hover:border-zinc-700 transition-all space-y-4"
            >
              {/* Course Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif italic text-zinc-100">
                      {course.name}
                    </h3>
                    <span className="text-xs font-mono text-zinc-400">
                      Instrument: <span className="text-zinc-200">{course.instrument}</span> • Duration: <span className="text-zinc-200">{course.duration}</span> • Enrolled: <span className="text-amber-400">{studentCount} students</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Standard Tuition
                    </span>
                    <span className="text-lg font-serif text-zinc-100">
                      {formatCurrency(course.feePerMonth, settings.currencySymbol)}
                      <span className="text-xs font-mono text-zinc-500 ml-0.5">/mo</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 pl-3 border-l border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCourse(course)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete({ type: 'course', id: course.id, name: course.name })}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Course Description */}
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {course.description}
              </p>

              {/* Associated Batches Sub-Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active Batch Schedules ({courseBatches.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddBatch(course.id)}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New Slot</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono">
                  {courseBatches.map((batch) => {
                    const batchStudents = students.filter((s) => s.batchId === batch.id).length;

                    return (
                      <div
                        key={batch.id}
                        className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-zinc-200 truncate font-sans">
                            {batch.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span className="truncate">{batch.timeSlot}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            Instructor: {batch.instructor} • Cap: {batchStudents}/{batch.maxCapacity}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBatch(batch)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            title="Edit Batch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete({ type: 'batch', id: batch.id, name: batch.name })}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COURSE MODAL */}
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        maxWidth="md"
        title={courseToEdit ? 'Edit Music Course' : 'Create New Music Course'}
        subtitle="Specify curriculum details and standard monthly tuition rate"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4 font-sans font-mono text-xs">
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Classical Piano Mastery"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-zinc-400 mb-1">
                Instrument *
              </label>
              <input
                type="text"
                value={courseInstrument}
                onChange={(e) => setCourseInstrument(e.target.value)}
                placeholder="e.g. Piano / Keyboard"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-zinc-400 mb-1">
                Monthly Fee (₹) *
              </label>
              <input
                type="number"
                min="500"
                value={courseFee}
                onChange={(e) => setCourseFee(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Course Duration / Syllabus *
            </label>
            <input
              type="text"
              value={courseDuration}
              onChange={(e) => setCourseDuration(e.target.value)}
              placeholder="e.g. 6 Months (Trinity Grade 1 - 3)"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Course Description
            </label>
            <textarea
              rows={3}
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Overview of syllabus, music theory, practicals, exam preparation..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setCourseModalOpen(false)}
              className="py-2 px-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {courseToEdit ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* BATCH MODAL */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        maxWidth="md"
        title={batchToEdit ? 'Edit Batch Schedule' : 'Create New Batch'}
        subtitle="Configure schedule timing, instructor, and classroom capacity"
      >
        <form onSubmit={handleSaveBatch} className="space-y-4 font-sans font-mono text-xs">
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Music Course *
            </label>
            <select
              value={batchCourseId}
              onChange={(e) => setBatchCourseId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.instrument})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Batch Title *
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. Weekend Beginners A"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Timing & Days *
            </label>
            <input
              type="text"
              value={batchTimeSlot}
              onChange={(e) => setBatchTimeSlot(e.target.value)}
              placeholder="e.g. Mon, Wed, Fri • 4:00 PM - 5:00 PM"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-zinc-400 mb-1">
                Instructor Name *
              </label>
              <input
                type="text"
                value={batchInstructor}
                onChange={(e) => setBatchInstructor(e.target.value)}
                placeholder="Prof. Alex Rivera"
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-zinc-400 mb-1">
                Max Student Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchCapacity}
                onChange={(e) => setBatchCapacity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              className="py-2 px-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {batchToEdit ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === 'course') {
              deleteCourse(itemToDelete.id);
            } else {
              deleteBatch(itemToDelete.id);
            }
            setItemToDelete(null);
          }
        }}
        title={`Delete ${itemToDelete?.type === 'course' ? 'Course' : 'Batch'}?`}
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AdminUser,
  AppNotification,
  Batch,
  Course,
  FeeRecord,
  FeeStatus,
  InstituteSettings,
  MembershipPlan,
  MembershipStatus,
  PaymentMethod,
  PaymentTransaction,
  Student,
  UserRole,
} from '../types';
import {
  initialSettings,
} from '../data/seedData';
import { calculateFeeStatus, calculateMembershipStatus } from '../services/dueEngine';
import { addMonths, getTodayString } from '../utils/dateUtils';
import { playSuccessChime, playNotificationPing } from '../utils/audioChime';
import { supabase } from '../lib/supabase';
import { loadPortalData, toDb } from '../services/database';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'celebration';
  duration?: number;
}

export interface StatsSummary {
  totalStudents: number;
  activeStudents: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  todayCollection: number;
  activeMemberships: number;
  expiringSoonMemberships: number;
  expiredMemberships: number;
  collectionRate: number;
}

export interface CurrentUserSession {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'customer';
  avatar: string;
  studentId?: string;
}

interface AppContextType {
  // Auth
  currentRole: UserRole | null;
  currentUser: CurrentUserSession | null;
  adminUser: AdminUser | null;
  currentStudent: Student | null;
  loginAsAdmin: (emailOrPhone: string, pass: string) => Promise<boolean>;
  loginAsStudent: (mobileOrEmail: string, passOrOtp: string) => Promise<boolean>;
  logout: () => void;
  switchUserRole: (role: UserRole, studentId?: string) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;

  // Data
  students: Student[];
  courses: Course[];
  batches: Batch[];
  membershipPlans: MembershipPlan[];
  feeRecords: FeeRecord[];
  transactions: PaymentTransaction[];
  notifications: AppNotification[];
  settings: InstituteSettings;

  // Real-time calculations
  stats: StatsSummary;
  getComputedFeeStatus: (feeRecord: FeeRecord) => FeeStatus;
  getComputedMembershipStatus: (student: Student) => MembershipStatus;
  getStudentFeeRecords: (studentId: string) => FeeRecord[];
  getStudentTransactions: (studentId: string) => PaymentTransaction[];

  // Mutators
  addStudent: (student: Omit<Student, 'id' | 'studentCode'>) => string;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addBatch: (batch: Omit<Batch, 'id'>) => void;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;

  addMembershipPlan: (plan: Omit<MembershipPlan, 'id'>) => void;
  updateMembershipPlan: (id: string, updates: Partial<MembershipPlan>) => void;

  recordFeePayment: (
    feeRecordId: string,
    detailsOrMethod?: PaymentMethod | {
      amount: number;
      paymentDate: string;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      notes?: string;
      discount?: number;
      lateFee?: number;
    },
    optionalTxId?: string
  ) => void;

  createManualFee: (
    studentId: string,
    monthYear: string,
    amount: number,
    dueDate: string,
    notes?: string
  ) => void;

  renewMembership: (
    studentId: string,
    planId: string,
    paymentMethod: PaymentMethod,
    transactionId?: string
  ) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (targetRole: UserRole) => void;
  sendCustomNotification: (
    targetRole: 'admin' | 'student' | 'all',
    targetStudentId: string | undefined,
    title: string,
    message: string,
    type: 'fee' | 'membership' | 'payment' | 'system'
  ) => void;

  updateSettings: (newSettings: Partial<InstituteSettings>) => void;
  resetDataToDefault: () => void;
  resetToDemoData: () => void;

  // Feedback
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'celebration', title?: string) => void;
  dismissToast: (id: string) => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'SMART_FEE_MUSIC_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return loadFromStorage('DARK_MODE', true);
  });

  useEffect(() => {
    saveToStorage('DARK_MODE', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth State
  // Always start logged out. A visitor must authenticate before any portal is rendered.
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Main Data States
  const [students, setStudents] = useState<Student[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);

  const [batches, setBatches] = useState<Batch[]>([]);

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [settings, setSettings] = useState<InstituteSettings>(() => {
    return loadFromStorage('SETTINGS', initialSettings);
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dbReady, setDbReady] = useState(false);

  const hydrateFromDatabase = useCallback(async () => {
    const data = await loadPortalData();
    setAdminUser(data.admin);
    setStudents(data.students);
    setCourses(data.courses);
    setBatches(data.batches);
    setMembershipPlans(data.plans);
    setFeeRecords(data.fees);
    setTransactions(data.payments);
    setNotifications(data.notifications);
    setSettings(data.settings);
    if (data.profile.role === 'admin') setCurrentRole('admin');
    else { setCurrentRole('student'); setCurrentStudent(data.students[0] || null); }
    setDbReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) hydrateFromDatabase().catch(console.error); });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setCurrentRole(null); setCurrentStudent(null); setDbReady(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [hydrateFromDatabase]);

  useEffect(() => {
    if (!dbReady || currentRole !== 'admin') return;
    const sync = async () => {
      const results = await Promise.all([
        courses.length ? supabase.from('courses').upsert(courses.map(toDb.course)) : Promise.resolve({error:null}),
        batches.length ? supabase.from('batches').upsert(batches.map(toDb.batch)) : Promise.resolve({error:null}),
        membershipPlans.length ? supabase.from('membership_plans').upsert(membershipPlans.map(toDb.plan)) : Promise.resolve({error:null}),
        students.length ? supabase.from('students').upsert(students.map(toDb.student)) : Promise.resolve({error:null}),
        feeRecords.length ? supabase.from('monthly_fees').upsert(feeRecords.map(toDb.fee)) : Promise.resolve({error:null}),
        transactions.length ? supabase.from('payments').upsert(transactions.map(toDb.payment)) : Promise.resolve({error:null}),
        notifications.length ? supabase.from('notifications').upsert(notifications.map(toDb.notification)) : Promise.resolve({error:null}),
      ]);
      const failure = results.find((r:any)=>r.error) as any;
      if (failure?.error) console.error('Supabase sync failed', failure.error);
    };
    const timer = window.setTimeout(sync, 250);
    return () => window.clearTimeout(timer);
  }, [dbReady,currentRole,courses,batches,membershipPlans,students,feeRecords,transactions,notifications]);

  // Computed Current User Session
  const currentUser: CurrentUserSession | null = useMemo(() => {
    if (currentRole === 'admin') {
      return {
        id: adminUser?.id || 'admin_1',
        fullName: adminUser?.name || 'Director Sarah Jenkins',
        email: adminUser?.email || 'admin@symphonymusic.edu',
        role: 'admin',
        avatar: adminUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    }
    if (currentRole === 'student' && currentStudent) {
      return {
        id: currentStudent.id,
        fullName: currentStudent.fullName,
        email: currentStudent.email,
        role: 'customer',
        avatar: currentStudent.avatar,
        studentId: currentStudent.id,
      };
    }
    return null;
  }, [currentRole, adminUser, currentStudent]);

  // Sync to local storage
  useEffect(() => saveToStorage('CURRENT_ROLE', currentRole), [currentRole]);
  useEffect(() => saveToStorage('ADMIN_USER', adminUser), [adminUser]);
  useEffect(() => saveToStorage('CURRENT_STUDENT', currentStudent), [currentStudent]);
  useEffect(() => saveToStorage('STUDENTS', students), [students]);
  useEffect(() => saveToStorage('COURSES', courses), [courses]);
  useEffect(() => saveToStorage('BATCHES', batches), [batches]);
  useEffect(() => saveToStorage('MEMBERSHIP_PLANS', membershipPlans), [membershipPlans]);
  useEffect(() => saveToStorage('FEE_RECORDS', feeRecords), [feeRecords]);
  useEffect(() => saveToStorage('TRANSACTIONS', transactions), [transactions]);
  useEffect(() => saveToStorage('NOTIFICATIONS', notifications), [notifications]);
  useEffect(() => saveToStorage('SETTINGS', settings), [settings]);

  // Trigger confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Toast helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'celebration' = 'success', title?: string) => {
      const id = 'toast_' + Math.random().toString(36).substr(2, 9);
      const newToast: ToastMessage = { id, message, type, title };
      setToasts((prev) => [...prev, newToast]);

      if (type === 'celebration' || type === 'success') {
        if (settings.enableSoundEffects) {
          playSuccessChime();
        }
        if (type === 'celebration') {
          triggerConfetti();
        }
      } else {
        if (settings.enableSoundEffects) {
          playNotificationPing();
        }
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [settings.enableSoundEffects, triggerConfetti]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dynamic status evaluation
  const getComputedFeeStatus = useCallback((feeRecord: FeeRecord): FeeStatus => {
    return calculateFeeStatus(feeRecord.dueDate, feeRecord.paymentDate);
  }, []);

  const getComputedMembershipStatus = useCallback((student: Student): MembershipStatus => {
    return calculateMembershipStatus(student.membershipEndDate);
  }, []);

  const getStudentFeeRecords = useCallback(
    (studentId: string): FeeRecord[] => {
      return feeRecords.filter((f) => f.studentId === studentId);
    },
    [feeRecords]
  );

  const getStudentTransactions = useCallback(
    (studentId: string): PaymentTransaction[] => {
      return transactions.filter((t) => t.studentId === studentId);
    },
    [transactions]
  );

  // Real-time statistics calculator
  const stats: StatsSummary = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;

    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let todayCollection = 0;

    const todayStr = getTodayString();

    feeRecords.forEach((fee) => {
      const computedStatus = calculateFeeStatus(fee.dueDate, fee.paymentDate);
      if (computedStatus === 'PAID') {
        totalCollected += fee.amount + (fee.lateFee || 0) - (fee.discount || 0);
        if (fee.paymentDate === todayStr) {
          todayCollection += fee.amount;
        }
      } else if (computedStatus === 'OVERDUE') {
        totalOverdue += fee.amount + (fee.lateFee || 0);
      } else {
        totalPending += fee.amount;
      }
    });

    let activeMemberships = 0;
    let expiringSoonMemberships = 0;
    let expiredMemberships = 0;

    students.forEach((student) => {
      const memStatus = calculateMembershipStatus(student.membershipEndDate);
      if (memStatus === 'ACTIVE') activeMemberships++;
      else if (memStatus === 'EXPIRING SOON' || memStatus === 'EXPIRING TODAY') expiringSoonMemberships++;
      else if (memStatus === 'EXPIRED') expiredMemberships++;
    });

    const totalExpected = totalCollected + totalPending + totalOverdue;
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return {
      totalStudents,
      activeStudents,
      totalCollected,
      totalPending,
      totalOverdue,
      todayCollection,
      activeMemberships,
      expiringSoonMemberships,
      expiredMemberships,
      collectionRate,
    };
  }, [students, feeRecords]);

  // Auth Handlers
  const loginAsAdmin = async (identifier: string, password: string): Promise<boolean> => {
    const credentials = identifier.includes('@') ? { email: identifier.trim(), password } : { phone: identifier.replace(/\s/g,''), password };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) { showToast(error.message, 'error'); return false; }
    try {
      const data = await loadPortalData();
      if (data.profile.role !== 'admin') { await supabase.auth.signOut(); showToast('This account does not have admin access.', 'error'); return false; }
      await hydrateFromDatabase();
      showToast(`Welcome back, ${data.profile.full_name}!`, 'success', 'Admin Signed In');
      return true;
    } catch (error:any) { await supabase.auth.signOut(); showToast(error.message || 'Unable to load account', 'error'); return false; }
  };

  const loginAsStudent = async (identifier: string, password: string): Promise<boolean> => {
    if (!identifier.includes('@') && /[a-z]/i.test(identifier)) { showToast('Use your registered email or phone number to sign in.', 'error'); return false; }
    const credentials = identifier.includes('@') ? { email: identifier.trim(), password } : { phone: identifier.replace(/\s/g,''), password };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) { showToast(error.message, 'error'); return false; }
    try {
      const data = await loadPortalData();
      if (data.profile.role !== 'student' || !data.students[0]) { await supabase.auth.signOut(); showToast('No student profile is linked to this account.', 'error'); return false; }
      await hydrateFromDatabase();
      showToast(`Welcome back, ${data.students[0].fullName}!`, 'success', 'Student Portal');
      return true;
    } catch (error:any) { await supabase.auth.signOut(); showToast(error.message || 'Unable to load account', 'error'); return false; }
  };

  const logout = () => {
    void supabase.auth.signOut();
    setCurrentRole(null);
    setCurrentStudent(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'CURRENT_ROLE');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'CURRENT_STUDENT');
    showToast('You have been logged out successfully.', 'info');
  };

  const switchUserRole = (role: UserRole, studentId?: string) => {
    if (role === 'admin') {
      setCurrentRole('admin');
      showToast('Switched to Institute Admin Portal', 'info');
    } else {
      setCurrentRole('student');
      if (studentId) {
        const stud = students.find((s) => s.id === studentId);
        if (stud) setCurrentStudent(stud);
      } else if (!currentStudent && students.length > 0) {
        setCurrentStudent(students[0]);
      }
      showToast(`Switched to Student Portal`, 'info');
    }
  };

  // CRUD for Students
  const addStudent = (newStudentData: Omit<Student, 'id' | 'studentCode'>): string => {
    const codeNumber = (students.length + 1).toString().padStart(3, '0');
    const newStudent: Student = {
      ...newStudentData,
      id: crypto.randomUUID(),
      studentCode: `SMA-2026-${codeNumber}`,
    };

    setStudents((prev) => [newStudent, ...prev]);

    // Create an initial fee record for current month
    const dueDate = `${getTodayString().slice(0, 8)}${String(newStudent.feeDueDay).padStart(2, '0')}`;
    const initialFee: FeeRecord = {
      id: crypto.randomUUID(),
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      monthYear: 'August 2026',
      amount: newStudent.monthlyFee,
      dueDate,
      status: calculateFeeStatus(dueDate),
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: 'Initial monthly tuition enrolled.',
    };

    setFeeRecords((prev) => [initialFee, ...prev]);

    // Admin Notification
    const notif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'admin',
      title: 'New Student Enrolled',
      message: `${newStudent.fullName} joined for ${newStudent.monthlyFee}/month.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`${newStudent.fullName} enrolled successfully!`, 'success');
    return newStudent.id;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    if (currentStudent && currentStudent.id === id) {
      setCurrentStudent((prev) => (prev ? { ...prev, ...updates } : null));
    }
    if (updates.fullName) {
      setFeeRecords((prev) =>
        prev.map((f) => (f.studentId === id ? { ...f, studentName: updates.fullName! } : f))
      );
    }
    showToast('Student profile updated', 'success');
  };

  const deleteStudent = (id: string) => {
    void supabase.from('students').delete().eq('id', id);
    const studentToDelete = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setFeeRecords((prev) => prev.filter((f) => f.studentId !== id));
    if (currentStudent && currentStudent.id === id) {
      setCurrentStudent(students[0] || null);
    }
    showToast(`Removed student record (${studentToDelete?.fullName || id})`, 'info');
  };

  // Courses & Batches
  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...course, id: crypto.randomUUID() };
    setCourses((prev) => [...prev, newCourse]);
    showToast(`Course "${course.name}" added`, 'success');
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Course updated', 'success');
  };

  const deleteCourse = (id: string) => {
    void supabase.from('courses').delete().eq('id', id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showToast('Course deleted', 'info');
  };

  const addBatch = (batch: Omit<Batch, 'id'>) => {
    const newBatch: Batch = { ...batch, id: crypto.randomUUID() };
    setBatches((prev) => [...prev, newBatch]);
    showToast(`Batch "${batch.name}" added`, 'success');
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    showToast('Batch updated', 'success');
  };

  const deleteBatch = (id: string) => {
    void supabase.from('batches').delete().eq('id', id);
    setBatches((prev) => prev.filter((b) => b.id !== id));
    showToast('Batch deleted', 'info');
  };

  // Membership Plans
  const addMembershipPlan = (plan: Omit<MembershipPlan, 'id'>) => {
    const newPlan: MembershipPlan = { ...plan, id: crypto.randomUUID() };
    setMembershipPlans((prev) => [...prev, newPlan]);
    showToast(`Membership plan "${plan.name}" added`, 'success');
  };

  const updateMembershipPlan = (id: string, updates: Partial<MembershipPlan>) => {
    setMembershipPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Membership plan updated', 'success');
  };

  // Fee Payment Recording (flexible signature)
  const recordFeePayment = (
    feeRecordId: string,
    detailsOrMethod?: PaymentMethod | {
      amount: number;
      paymentDate: string;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      notes?: string;
      discount?: number;
      lateFee?: number;
    },
    optionalTxId?: string
  ) => {
    let targetFee = feeRecords.find((f) => f.id === feeRecordId);
    if (!targetFee) return;

    let finalAmount = targetFee.amount;
    let finalDate = getTodayString();
    let finalMethod: PaymentMethod = 'UPI';
    let finalTxId = optionalTxId || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    let finalNotes = targetFee.notes;
    let finalDiscount: number | undefined = undefined;
    let finalLateFee: number | undefined = undefined;

    if (typeof detailsOrMethod === 'object' && detailsOrMethod !== null) {
      finalAmount = detailsOrMethod.amount;
      finalDate = detailsOrMethod.paymentDate;
      finalMethod = detailsOrMethod.paymentMethod;
      if (detailsOrMethod.transactionId) finalTxId = detailsOrMethod.transactionId;
      if (detailsOrMethod.notes) finalNotes = detailsOrMethod.notes;
      finalDiscount = detailsOrMethod.discount;
      finalLateFee = detailsOrMethod.lateFee;
    } else if (typeof detailsOrMethod === 'string') {
      finalMethod = detailsOrMethod as PaymentMethod;
      if (optionalTxId) finalTxId = optionalTxId;
    }

    let studentId = targetFee.studentId;
    let studentName = targetFee.studentName;
    let monthYear = targetFee.monthYear;

    setFeeRecords((prev) =>
      prev.map((f) => {
        if (f.id === feeRecordId) {
          return {
            ...f,
            amount: finalAmount,
            paymentDate: finalDate,
            paymentMethod: finalMethod,
            transactionId: finalTxId,
            notes: finalNotes,
            discount: finalDiscount,
            lateFee: finalLateFee,
            status: 'PAID',
          };
        }
        return f;
      })
    );

    // Create payment transaction
    const txNumber = 'REC-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newTx: PaymentTransaction = {
      id: crypto.randomUUID(),
      feeRecordId,
      studentId,
      studentName,
      amount: finalAmount,
      date: `${finalDate} ${new Date().toTimeString().slice(0, 8)}`,
      method: finalMethod,
      transactionRef: finalTxId,
      type: 'FEE',
      status: 'SUCCESS',
      notes: `${monthYear} Fee Settlement`,
      receiptNumber: txNumber,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // In-app notifications
    const adminNotif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'admin',
      title: 'Payment Recorded',
      message: `Fee of ${settings.currencySymbol}${finalAmount} recorded for ${studentName} (${monthYear}) via ${finalMethod}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const studentNotif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'student',
      targetStudentId: studentId,
      title: 'Payment Recorded Successfully',
      message: `Your payment of ${settings.currencySymbol}${finalAmount} for ${monthYear} is verified. Receipt #${txNumber}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [adminNotif, studentNotif, ...prev]);
    showToast(`Payment of ${settings.currencySymbol}${finalAmount} recorded for ${studentName}`, 'celebration', 'Payment Success');
  };

  const createManualFee = (
    studentId: string,
    monthYear: string,
    amount: number,
    dueDate: string,
    notes?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const newFee: FeeRecord = {
      id: crypto.randomUUID(),
      studentId,
      studentName: student.fullName,
      monthYear,
      amount,
      dueDate,
      status: calculateFeeStatus(dueDate),
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      notes,
    };

    setFeeRecords((prev) => [newFee, ...prev]);

    const notif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'student',
      targetStudentId: studentId,
      title: 'New Fee Invoice Generated',
      message: `Invoice for ${monthYear} (${settings.currencySymbol}${amount}) has been generated. Due on ${dueDate}.`,
      type: 'fee',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    showToast(`Fee invoice created for ${student.fullName}`, 'success');
  };

  // Membership Renewal
  const renewMembership = (
    studentId: string,
    planId: string,
    paymentMethod: PaymentMethod,
    transactionId?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    const plan = membershipPlans.find((p) => p.id === planId);
    if (!student || !plan) return;

    const todayStr = getTodayString();
    const currentEnd = student.membershipEndDate;
    const isAlreadyExpired = calculateMembershipStatus(currentEnd) === 'EXPIRED';
    const newStartDate = isAlreadyExpired ? todayStr : currentEnd;
    const newEndDate = addMonths(newStartDate, plan.durationMonths);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            planId,
            membershipStartDate: isAlreadyExpired ? todayStr : s.membershipStartDate,
            membershipEndDate: newEndDate,
          };
        }
        return s;
      })
    );

    if (currentStudent && currentStudent.id === studentId) {
      setCurrentStudent((prev) =>
        prev
          ? {
              ...prev,
              planId,
              membershipStartDate: isAlreadyExpired ? todayStr : prev.membershipStartDate,
              membershipEndDate: newEndDate,
            }
          : null
      );
    }

    const txNumber = 'MEM-2026-' + Math.floor(1000 + Math.random() * 9000);
    const tx: PaymentTransaction = {
      id: crypto.randomUUID(),
      studentId,
      studentName: student.fullName,
      amount: plan.price,
      date: `${todayStr} ${new Date().toTimeString().slice(0, 8)}`,
      method: paymentMethod,
      transactionRef: transactionId || 'MEM-TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: 'MEMBERSHIP_RENEWAL',
      status: 'SUCCESS',
      notes: `${plan.name} Renewal (${plan.durationMonths} Months)`,
      receiptNumber: txNumber,
    };

    setTransactions((prev) => [tx, ...prev]);

    const adminNotif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'admin',
      title: 'Membership Renewed',
      message: `${student.fullName} renewed "${plan.name}" until ${newEndDate}.`,
      type: 'membership',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const studentNotif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole: 'student',
      targetStudentId: studentId,
      title: 'Membership Renewed Successfully',
      message: `Your "${plan.name}" is now active until ${newEndDate}. Enjoy your classes!`,
      type: 'membership',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [adminNotif, studentNotif, ...prev]);
    showToast(
      `Membership renewed for ${student.fullName} until ${newEndDate}`,
      'celebration',
      'Membership Renewed Successfully'
    );
  };

  const markNotificationAsRead = (id: string) => {
    void supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = (targetRole: UserRole) => {
    const roles = targetRole === 'admin' ? ['admin','all'] : ['student','all'];
    void supabase.from('notifications').update({read:true}).in('target_role', roles);
    setNotifications((prev) =>
      prev.map((n) => {
        if (targetRole === 'admin' && (n.targetRole === 'admin' || n.targetRole === 'all')) {
          return { ...n, read: true };
        }
        if (targetRole === 'student' && (n.targetRole === 'student' || n.targetRole === 'all')) {
          return { ...n, read: true };
        }
        return n;
      })
    );
    showToast('All notifications marked as read', 'info');
  };

  const sendCustomNotification = (
    targetRole: 'admin' | 'student' | 'all',
    targetStudentId: string | undefined,
    title: string,
    message: string,
    type: 'fee' | 'membership' | 'payment' | 'system'
  ) => {
    const notif: AppNotification = {
      id: crypto.randomUUID(),
      targetRole,
      targetStudentId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Notification dispatched', 'success');
  };

  const updateSettings = (newSettings: Partial<InstituteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    const merged = { ...settings, ...newSettings };
    void supabase.from('institute_settings').update({ institute_name:merged.instituteName, tagline:merged.tagline||merged.instituteTagline, logo_url:merged.logoUrl||null, contact_email:merged.contactEmail||merged.instituteEmail||null, contact_phone:merged.contactPhone||merged.institutePhone||null, whatsapp_number:merged.whatsappNumber||null, address:merged.address||merged.instituteAddress||null, currency_symbol:merged.currencySymbol, currency_code:merged.currencyCode||'INR', default_fee_due_day:merged.defaultFeeDueDay||5, late_fee_amount:merged.lateFeeAmount||0, fee_reminder_template:merged.feeReminderTemplate||merged.whatsappFeeReminderTemplate||null, overdue_reminder_template:merged.overdueReminderTemplate||merged.whatsappOverdueReminderTemplate||null, membership_reminder_template:merged.membershipReminderTemplate||merged.whatsappMembershipExpiryTemplate||null, upi_id:merged.upiId||null, bank_details:merged.bankDetails||null, enable_sound_effects:merged.enableSoundEffects??true, enable_auto_whatsapp_prompt:merged.enableAutoWhatsAppPrompt??true }).eq('id',true);
    showToast('Academy settings saved successfully', 'success');
  };

  const resetDataToDefault = () => {
    void hydrateFromDatabase().then(() => showToast('Latest database data restored', 'info'));
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        adminUser,
        currentStudent,
        loginAsAdmin,
        loginAsStudent,
        logout,
        switchUserRole,
        darkMode,
        setDarkMode,
        students,
        courses,
        batches,
        membershipPlans,
        feeRecords,
        transactions,
        notifications,
        settings,
        stats,
        getComputedFeeStatus,
        getComputedMembershipStatus,
        getStudentFeeRecords,
        getStudentTransactions,
        addStudent,
        updateStudent,
        deleteStudent,
        addCourse,
        updateCourse,
        deleteCourse,
        addBatch,
        updateBatch,
        deleteBatch,
        addMembershipPlan,
        updateMembershipPlan,
        recordFeePayment,
        createManualFee,
        renewMembership,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendCustomNotification,
        updateSettings,
        resetDataToDefault,
        resetToDemoData: resetDataToDefault,
        toasts,
        showToast,
        dismissToast,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

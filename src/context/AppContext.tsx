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
  initialAdmin,
  initialBatches,
  initialCourses,
  initialFeeRecords,
  initialMembershipPlans,
  initialNotifications,
  initialSettings,
  initialStudents,
  initialTransactions,
} from '../data/seedData';
import { calculateFeeStatus, calculateMembershipStatus } from '../services/dueEngine';
import { addMonths, getTodayString } from '../utils/dateUtils';
import { playSuccessChime, playNotificationPing } from '../utils/audioChime';

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
  loginAsAdmin: (emailOrPhone: string, pass: string) => boolean;
  loginAsStudent: (mobileOrEmail: string, passOrOtp: string) => boolean;
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

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    return loadFromStorage<AdminUser | null>('ADMIN_USER', initialAdmin);
  });

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Main Data States
  const [students, setStudents] = useState<Student[]>(() => {
    return loadFromStorage('STUDENTS', initialStudents);
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    return loadFromStorage('COURSES', initialCourses);
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    return loadFromStorage('BATCHES', initialBatches);
  });

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(() => {
    return loadFromStorage('MEMBERSHIP_PLANS', initialMembershipPlans);
  });

  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => {
    return loadFromStorage('FEE_RECORDS', initialFeeRecords);
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    return loadFromStorage('TRANSACTIONS', initialTransactions);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return loadFromStorage('NOTIFICATIONS', initialNotifications);
  });

  const [settings, setSettings] = useState<InstituteSettings>(() => {
    return loadFromStorage('SETTINGS', initialSettings);
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
  const loginAsAdmin = (emailOrPhone: string, _pass: string): boolean => {
    const isMatch =
      emailOrPhone.toLowerCase() === 'admin@symphonymusic.edu' ||
      emailOrPhone === '9845012345' ||
      emailOrPhone.toLowerCase().includes('admin');

    if (isMatch && _pass === 'admin123') {
      setCurrentRole('admin');
      setAdminUser(initialAdmin);
      showToast(`Welcome back, ${initialAdmin.name}!`, 'success', 'Admin Signed In');
      return true;
    }
    showToast('Invalid admin credentials. Use admin@symphonymusic.edu / admin123', 'error');
    return false;
  };

  const loginAsStudent = (mobileOrEmail: string, _passOrOtp: string): boolean => {
    const cleanQuery = mobileOrEmail.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const found = students.find((s) => {
      const sMobile = s.mobile.replace(/[^0-9]/g, '');
      return (
        s.email.toLowerCase() === cleanQuery ||
        sMobile.includes(cleanQuery) ||
        s.studentCode.toLowerCase() === cleanQuery ||
        s.fullName.toLowerCase().includes(cleanQuery)
      );
    });

    if (found) {
      setCurrentRole('student');
      setCurrentStudent(found);
      showToast(`Welcome back, ${found.fullName}!`, 'success', 'Student Portal');
      return true;
    }
    showToast('Student not found with this mobile or email. Try "rahul" or "9876543210".', 'error');
    return false;
  };

  const logout = () => {
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
      id: 'stud_' + Date.now(),
      studentCode: `SMA-2026-${codeNumber}`,
    };

    setStudents((prev) => [newStudent, ...prev]);

    // Create an initial fee record for current month
    const dueDate = `${getTodayString().slice(0, 8)}${String(newStudent.feeDueDay).padStart(2, '0')}`;
    const initialFee: FeeRecord = {
      id: 'fee_' + Date.now(),
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
      id: 'notif_' + Date.now(),
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
    const newCourse: Course = { ...course, id: 'c_' + Date.now() };
    setCourses((prev) => [...prev, newCourse]);
    showToast(`Course "${course.name}" added`, 'success');
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Course updated', 'success');
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showToast('Course deleted', 'info');
  };

  const addBatch = (batch: Omit<Batch, 'id'>) => {
    const newBatch: Batch = { ...batch, id: 'b_' + Date.now() };
    setBatches((prev) => [...prev, newBatch]);
    showToast(`Batch "${batch.name}" added`, 'success');
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    showToast('Batch updated', 'success');
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    showToast('Batch deleted', 'info');
  };

  // Membership Plans
  const addMembershipPlan = (plan: Omit<MembershipPlan, 'id'>) => {
    const newPlan: MembershipPlan = { ...plan, id: 'plan_' + Date.now() };
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
      id: 'tx_' + Date.now(),
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
      id: 'notif_' + Date.now(),
      targetRole: 'admin',
      title: 'Payment Recorded',
      message: `Fee of ${settings.currencySymbol}${finalAmount} recorded for ${studentName} (${monthYear}) via ${finalMethod}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const studentNotif: AppNotification = {
      id: 'notif_s_' + Date.now(),
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
      id: 'fee_' + Date.now(),
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
      id: 'notif_f_' + Date.now(),
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
      id: 'tx_mem_' + Date.now(),
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
      id: 'notif_mem_a_' + Date.now(),
      targetRole: 'admin',
      title: 'Membership Renewed',
      message: `${student.fullName} renewed "${plan.name}" until ${newEndDate}.`,
      type: 'membership',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const studentNotif: AppNotification = {
      id: 'notif_mem_s_' + Date.now(),
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = (targetRole: UserRole) => {
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
      id: 'notif_custom_' + Date.now(),
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
    showToast('Academy settings saved successfully', 'success');
  };

  const resetDataToDefault = () => {
    setStudents(initialStudents);
    setCourses(initialCourses);
    setBatches(initialBatches);
    setMembershipPlans(initialMembershipPlans);
    setFeeRecords(initialFeeRecords);
    setTransactions(initialTransactions);
    setNotifications(initialNotifications);
    setSettings(initialSettings);
    setCurrentStudent(initialStudents[0]);
    showToast('All data reset to academy default state', 'info');
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

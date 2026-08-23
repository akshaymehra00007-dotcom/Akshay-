export type UserRole = 'admin' | 'student';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin';
  avatar?: string;
  instituteTitle?: string;
}

export type FeeStatus = 'PAID' | 'UPCOMING' | 'DUE TODAY' | 'OVERDUE';

export type MembershipStatus = 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRING TODAY' | 'EXPIRED';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export interface Course {
  id: string;
  name: string;
  instrument: string;
  code?: string;
  description: string;
  feePerMonth: number;
  duration?: string;
  iconName?: string;
  active?: boolean;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  timeSlot: string;
  days?: string[];
  instructor: string;
  capacity?: number;
  maxCapacity?: number;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  discountPercent: number;
  description: string;
  isPopular?: boolean;
  active?: boolean;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  mobile: string;
  whatsapp: string;
  address: string;
  courseId: string;
  batchId: string;
  joiningDate: string; // YYYY-MM-DD
  monthlyFee: number;
  planId: string;
  membershipStartDate: string; // YYYY-MM-DD
  membershipEndDate: string; // YYYY-MM-DD
  feeDueDay: number; // 1 to 28
  status: 'active' | 'inactive';
  notes?: string;
  avatar: string;
  passwordHash?: string;
  parentName?: string;
  guardianContact?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  monthYear: string; // e.g. "August 2026"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  notes?: string;
  status: FeeStatus;
  invoiceNumber: string;
  lateFee?: number;
  discount?: number;
}

export interface PaymentTransaction {
  id: string;
  feeRecordId?: string;
  membershipId?: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string; // YYYY-MM-DD HH:mm:ss
  method: PaymentMethod;
  transactionRef: string;
  type: 'FEE' | 'MEMBERSHIP_RENEWAL' | 'REGISTRATION' | 'MISC';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  notes?: string;
  receiptNumber: string;
}

export interface AppNotification {
  id: string;
  targetRole: 'admin' | 'student' | 'all';
  studentId?: string;
  targetStudentId?: string;
  title: string;
  message: string;
  type: 'fee' | 'membership' | 'payment' | 'system';
  read: boolean;
  createdAt: string;
  actionLink?: string;
}

export interface InstituteSettings {
  instituteName: string;
  instituteTagline?: string;
  tagline?: string;
  logoUrl?: string;
  instituteEmail?: string;
  contactEmail?: string;
  institutePhone?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  instituteAddress?: string;
  address?: string;
  currencySymbol: string;
  currencyCode?: string;
  defaultFeeDueDay?: number;
  lateFeeAmount?: number;
  whatsappFeeReminderTemplate?: string;
  whatsappOverdueReminderTemplate?: string;
  whatsappMembershipExpiryTemplate?: string;
  feeReminderTemplate?: string;
  membershipReminderTemplate?: string;
  overdueReminderTemplate?: string;
  upiId?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  enableSoundEffects?: boolean;
  enableAutoWhatsAppPrompt?: boolean;
}

export type Settings = InstituteSettings;

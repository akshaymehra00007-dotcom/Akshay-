import { FeeRecord, FeeStatus, MembershipStatus, Student, InstituteSettings } from '../types';
import { getDaysDifference, formatDateFull, formatCurrency, APP_TODAY } from '../utils/dateUtils';

/**
 * Calculates current real-time Fee Status based on payment date and due date
 */
export function calculateFeeStatus(dueDateStr: string, paymentDateStr?: string): FeeStatus {
  if (paymentDateStr && paymentDateStr.trim() !== '') {
    return 'PAID';
  }

  const daysDiff = getDaysDifference(dueDateStr, APP_TODAY);

  if (daysDiff === 0) {
    return 'DUE TODAY';
  } else if (daysDiff < 0) {
    return 'OVERDUE';
  } else {
    return 'UPCOMING';
  }
}

/**
 * Calculates current real-time Membership Status based on start and end dates
 */
export function calculateMembershipStatus(endDateStr: string): MembershipStatus {
  const daysDiff = getDaysDifference(endDateStr, APP_TODAY);

  if (daysDiff < 0) {
    return 'EXPIRED';
  } else if (daysDiff === 0) {
    return 'EXPIRING TODAY';
  } else if (daysDiff <= 10) {
    return 'EXPIRING SOON';
  } else {
    return 'ACTIVE';
  }
}

/**
 * Generates WhatsApp reminder text for Fee Due
 */
export function generateFeeWhatsAppMessage(
  student: Student,
  feeRecord: FeeRecord,
  settings: InstituteSettings
): string {
  const template = settings.feeReminderTemplate || 
    "Hello {studentName}, this is a friendly reminder from {instituteName}. Your monthly fee of {amount} is due on {dueDate}. Kindly complete the payment at your convenience. Thank you.";

  const formattedDue = formatDateFull(feeRecord.dueDate);
  const formattedAmt = formatCurrency(feeRecord.amount, settings.currencySymbol);

  let msg = template
    .replace(/{studentName}/g, student.fullName)
    .replace(/{instituteName}/g, settings.instituteName)
    .replace(/{amount}/g, formattedAmt)
    .replace(/{dueDate}/g, formattedDue)
    .replace(/{monthYear}/g, feeRecord.monthYear)
    .replace(/{upiId}/g, settings.upiId || '')
    .replace(/{phone}/g, settings.contactPhone);

  return msg;
}

/**
 * Generates WhatsApp reminder text for Overdue Fee
 */
export function generateOverdueWhatsAppMessage(
  student: Student,
  feeRecord: FeeRecord,
  settings: InstituteSettings
): string {
  const daysOverdue = Math.abs(getDaysDifference(feeRecord.dueDate, APP_TODAY));
  const template = settings.overdueReminderTemplate || 
    "Dear {studentName}, your fee payment of {amount} for {monthYear} at {instituteName} was due on {dueDate} ({daysOverdue} days ago). Please settle the pending amount to keep your classes uninterrupted. UPI: {upiId}. Thank you.";

  const formattedDue = formatDateFull(feeRecord.dueDate);
  const formattedAmt = formatCurrency(feeRecord.amount, settings.currencySymbol);

  let msg = template
    .replace(/{studentName}/g, student.fullName)
    .replace(/{instituteName}/g, settings.instituteName)
    .replace(/{amount}/g, formattedAmt)
    .replace(/{dueDate}/g, formattedDue)
    .replace(/{monthYear}/g, feeRecord.monthYear)
    .replace(/{daysOverdue}/g, daysOverdue.toString())
    .replace(/{upiId}/g, settings.upiId || '')
    .replace(/{phone}/g, settings.contactPhone);

  return msg;
}

/**
 * Generates WhatsApp reminder text for Membership Expiry
 */
export function generateMembershipWhatsAppMessage(
  student: Student,
  planName: string,
  settings: InstituteSettings
): string {
  const template = settings.membershipReminderTemplate ||
    "Hello {studentName}, your {planName} membership with {instituteName} will expire on {expiryDate}. Please renew your membership to continue your music classes without disruption. Thank you.";

  const formattedExpiry = formatDateFull(student.membershipEndDate);

  let msg = template
    .replace(/{studentName}/g, student.fullName)
    .replace(/{instituteName}/g, settings.instituteName)
    .replace(/{planName}/g, planName)
    .replace(/{expiryDate}/g, formattedExpiry)
    .replace(/{phone}/g, settings.contactPhone);

  return msg;
}

/**
 * Creates a clean clickable WhatsApp URL
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  // Clean phone number (remove spaces, dashes, +, parentheses)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // If 10-digit Indian number without country code, prepend 91
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

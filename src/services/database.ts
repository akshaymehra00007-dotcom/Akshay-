import { supabase } from '../lib/supabase';
import type { AdminUser, AppNotification, Batch, Course, FeeRecord, InstituteSettings, MembershipPlan, PaymentTransaction, Student } from '../types';

const isoDate = (value: string | null | undefined) => value ? value.slice(0, 10) : '';

export const dbMap = {
  course: (r: any): Course => ({ id:r.id, name:r.name, instrument:r.instrument, code:r.code, description:r.description, feePerMonth:Number(r.fee_per_month), duration:r.duration, iconName:r.icon_name, active:r.active }),
  batch: (r: any): Batch => ({ id:r.id, name:r.name, courseId:r.course_id, timeSlot:r.time_slot, days:r.days || [], instructor:r.instructor, capacity:r.capacity, maxCapacity:r.capacity }),
  plan: (r: any): MembershipPlan => ({ id:r.id, name:r.name, durationMonths:r.duration_months, price:Number(r.price), discountPercent:Number(r.discount_percent), description:r.description, isPopular:r.is_popular, active:r.active }),
  student: (r: any): Student => ({ id:r.id, studentCode:r.student_code, fullName:r.full_name, email:r.email || '', mobile:r.mobile, whatsapp:r.whatsapp || r.mobile, address:r.address, courseId:r.course_id || '', batchId:r.batch_id || '', joiningDate:isoDate(r.joining_date), monthlyFee:Number(r.monthly_fee), planId:r.plan_id || '', membershipStartDate:isoDate(r.membership_start_date), membershipEndDate:isoDate(r.membership_end_date), feeDueDay:r.fee_due_day, status:r.status, notes:r.notes || '', avatar:r.avatar_url || '', parentName:r.parent_name || '', guardianContact:r.guardian_contact || '' }),
  fee: (r: any): FeeRecord => ({ id:r.id, studentId:r.student_id, studentName:r.students?.full_name || '', monthYear:new Date(`${r.fee_month}T00:00:00`).toLocaleDateString('en-IN',{month:'long',year:'numeric'}), amount:Number(r.amount), dueDate:isoDate(r.due_date), paymentDate:isoDate(r.payment_date) || undefined, paymentMethod:r.payment_method || undefined, transactionId:r.transaction_id || undefined, notes:r.notes || undefined, status:r.status || 'UPCOMING', invoiceNumber:r.invoice_number, lateFee:Number(r.late_fee || 0), discount:Number(r.discount || 0) }),
  payment: (r: any): PaymentTransaction => ({ id:r.id, feeRecordId:r.fee_id || undefined, studentId:r.student_id, studentName:r.students?.full_name || '', amount:Number(r.amount), date:r.paid_at, method:r.method, transactionRef:r.transaction_ref || '', type:r.type, status:r.status, notes:r.notes || undefined, receiptNumber:r.receipt_number }),
  notification: (r: any): AppNotification => ({ id:r.id, targetRole:r.target_role, studentId:r.student_id || undefined, targetStudentId:r.student_id || undefined, title:r.title, message:r.message, type:r.type, read:r.read, createdAt:r.created_at, actionLink:r.action_link || undefined }),
};

export async function loadPortalData() {
  const [profile, students, courses, batches, plans, fees, payments, notifications, settings] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('students').select('*').order('created_at',{ascending:false}),
    supabase.from('courses').select('*').order('name'),
    supabase.from('batches').select('*').order('name'),
    supabase.from('membership_plans').select('*').order('duration_months'),
    supabase.from('monthly_fee_status').select('*, students(full_name)').order('due_date',{ascending:false}),
    supabase.from('payments').select('*, students(full_name)').order('paid_at',{ascending:false}),
    supabase.from('notifications').select('*').order('created_at',{ascending:false}),
    supabase.from('institute_settings').select('*').single(),
  ]);
  const firstError = [profile,students,courses,batches,plans,fees,payments,notifications,settings].find(x=>x.error)?.error;
  if (firstError) throw firstError;
  const p:any = profile.data;
  const admin:AdminUser|null = p?.role === 'admin' ? { id:p.id, name:p.full_name, email:p.email || '', phone:p.phone || '', role:'admin', avatar:p.avatar_url || '', instituteTitle:p.institute_title || '' } : null;
  const s:any = settings.data;
  const mappedSettings:InstituteSettings = { instituteName:s.institute_name, tagline:s.tagline, instituteTagline:s.tagline, logoUrl:s.logo_url, contactEmail:s.contact_email, instituteEmail:s.contact_email, contactPhone:s.contact_phone, institutePhone:s.contact_phone, whatsappNumber:s.whatsapp_number, address:s.address, instituteAddress:s.address, currencySymbol:s.currency_symbol, currencyCode:s.currency_code, defaultFeeDueDay:s.default_fee_due_day, lateFeeAmount:Number(s.late_fee_amount), feeReminderTemplate:s.fee_reminder_template, whatsappFeeReminderTemplate:s.fee_reminder_template, overdueReminderTemplate:s.overdue_reminder_template, whatsappOverdueReminderTemplate:s.overdue_reminder_template, membershipReminderTemplate:s.membership_reminder_template, whatsappMembershipExpiryTemplate:s.membership_reminder_template, upiId:s.upi_id, bankDetails:s.bank_details, enableSoundEffects:s.enable_sound_effects, enableAutoWhatsAppPrompt:s.enable_auto_whatsapp_prompt };
  return { profile:p, admin, students:(students.data||[]).map(dbMap.student), courses:(courses.data||[]).map(dbMap.course), batches:(batches.data||[]).map(dbMap.batch), plans:(plans.data||[]).map(dbMap.plan), fees:(fees.data||[]).map(dbMap.fee), payments:(payments.data||[]).map(dbMap.payment), notifications:(notifications.data||[]).map(dbMap.notification), settings:mappedSettings };
}

export const toDb = {
  course:(x:Course)=>({id:x.id,name:x.name,instrument:x.instrument,code:x.code||null,description:x.description,fee_per_month:x.feePerMonth,duration:x.duration||null,icon_name:x.iconName||null,active:x.active??true}),
  batch:(x:Batch)=>({id:x.id,course_id:x.courseId,name:x.name,time_slot:x.timeSlot,days:x.days||[],instructor:x.instructor,capacity:x.capacity||x.maxCapacity||10}),
  plan:(x:MembershipPlan)=>({id:x.id,name:x.name,duration_months:x.durationMonths,price:x.price,discount_percent:x.discountPercent,description:x.description,is_popular:x.isPopular||false,active:x.active??true}),
  student:(x:Student)=>({id:x.id,student_code:x.studentCode,full_name:x.fullName,email:x.email||null,mobile:x.mobile,whatsapp:x.whatsapp||null,address:x.address,course_id:x.courseId||null,batch_id:x.batchId||null,joining_date:x.joiningDate,monthly_fee:x.monthlyFee,plan_id:x.planId||null,membership_start_date:x.membershipStartDate||null,membership_end_date:x.membershipEndDate||null,fee_due_day:x.feeDueDay,status:x.status,notes:x.notes||null,avatar_url:x.avatar||null,parent_name:x.parentName||null,guardian_contact:x.guardianContact||null}),
  fee:(x:FeeRecord)=>({id:x.id,student_id:x.studentId,fee_month:new Date(Date.parse(`1 ${x.monthYear}`)).toISOString().slice(0,7)+'-01',amount:x.amount,due_date:x.dueDate,payment_date:x.paymentDate||null,payment_method:x.paymentMethod||null,transaction_id:x.transactionId||null,notes:x.notes||null,invoice_number:x.invoiceNumber,late_fee:x.lateFee||0,discount:x.discount||0}),
  payment:(x:PaymentTransaction)=>({id:x.id,fee_id:x.feeRecordId||null,student_id:x.studentId,amount:x.amount,paid_at:x.date,method:x.method,transaction_ref:x.transactionRef||null,type:x.type,status:x.status,notes:x.notes||null,receipt_number:x.receiptNumber}),
  notification:(x:AppNotification)=>({id:x.id,target_role:x.targetRole,student_id:x.targetStudentId||x.studentId||null,title:x.title,message:x.message,type:x.type,read:x.read,action_link:x.actionLink||null,created_at:x.createdAt}),
};


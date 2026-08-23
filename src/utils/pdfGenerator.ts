import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FeeRecord, Student, Course, Batch, InstituteSettings } from '../types';
import { formatDateFull, formatCurrency } from './dateUtils';

export function generatePaymentReceiptPDF(
  feeRecord: FeeRecord,
  student: Student,
  course?: Course,
  batch?: Batch,
  settings?: InstituteSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const instituteName = settings?.instituteName || 'Harmony Sound Music Academy';
  const tagline = settings?.tagline || 'Excellence in Instrumental & Vocal Performance';
  const address = settings?.address || '402 Melody Square, Music District, Bengaluru 560034';
  const phone = settings?.contactPhone || '+91 98765 43210';
  const email = settings?.contactEmail || 'admin@harmonymusic.edu';
  const currency = settings?.currencySymbol || '₹';

  // Background Header Accent
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 45, 'F');

  // Header Title & Branding
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(instituteName, 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(tagline, 15, 27);
  doc.text(`${address} | Phone: ${phone} | Email: ${email}`, 15, 34);

  // Badge: OFFICIAL FEE RECEIPT
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.roundedRect(140, 12, 55, 14, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('OFFICIAL FEE RECEIPT', 143, 21);

  // Receipt Meta Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Box 1: Receipt Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 52, 85, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('RECEIPT DETAILS', 20, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`Receipt / Inv No: `, 20, 65);
  doc.setFont('helvetica', 'bold');
  doc.text(`${feeRecord.invoiceNumber || 'INV-2026-001'}`, 48, 65);

  doc.setFont('helvetica', 'normal');
  doc.text(`Billing Month: `, 20, 72);
  doc.text(`${feeRecord.monthYear}`, 48, 72);

  doc.text(`Payment Date: `, 20, 79);
  doc.text(`${feeRecord.paymentDate ? formatDateFull(feeRecord.paymentDate) : 'Pending'}`, 48, 79);

  // Box 2: Student Details
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(110, 52, 85, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('STUDENT INFORMATION', 115, 58);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`Student Name: `, 115, 65);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.fullName}`, 140, 65);

  doc.setFont('helvetica', 'normal');
  doc.text(`Student ID: `, 115, 72);
  doc.text(`${student.studentCode}`, 140, 72);

  doc.text(`Course & Batch: `, 115, 79);
  doc.text(`${course?.name || 'Music Course'} (${batch?.name || 'Standard'})`, 140, 79);

  // Table Items
  const tableData = [
    [
      '1',
      `Monthly Tuition Fee - ${feeRecord.monthYear}`,
      `${course?.instrument || 'Music Training'} (${batch?.timeSlot || 'Scheduled Session'})`,
      formatCurrency(feeRecord.amount, currency),
    ],
  ];

  if (feeRecord.lateFee && feeRecord.lateFee > 0) {
    tableData.push([
      '2',
      'Late Settlement Fee',
      'Overdue penalty processing',
      formatCurrency(feeRecord.lateFee, currency),
    ]);
  }

  if (feeRecord.discount && feeRecord.discount > 0) {
    tableData.push([
      '3',
      'Membership Benefit Discount',
      'Special discount deduction',
      `-${formatCurrency(feeRecord.discount, currency)}`,
    ]);
  }

  autoTable(doc, {
    startY: 96,
    head: [['#', 'Item Description', 'Details / Schedule', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 58 },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  // Summary box below table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 135;

  const totalPayable = feeRecord.amount + (feeRecord.lateFee || 0) - (feeRecord.discount || 0);

  // Total summary block
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, finalY + 8, 75, 28, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Mode:', 125, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${feeRecord.paymentMethod || 'UPI / Cash'}`, 155, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Paid:', 125, finalY + 28);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`${formatCurrency(totalPayable, currency)}`, 160, finalY + 28);

  // Transaction Stamp & Ref
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Transaction Reference: ${feeRecord.transactionId || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()}`, 15, finalY + 16);
  doc.text(`Payment Status: ${feeRecord.status}`, 15, finalY + 23);
  doc.text(`Notes: ${feeRecord.notes || 'Verified and posted to academy ledger.'}`, 15, finalY + 30);

  // Status Stamp Graphic
  if (feeRecord.status === 'PAID') {
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.2);
    doc.roundedRect(15, finalY + 45, 45, 18, 2, 2, 'D');
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PAID', 27, finalY + 56);
  }

  // Signatory & Footer
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.line(135, finalY + 62, 190, finalY + 62);
  doc.text('Authorized Signatory', 145, finalY + 67);
  doc.text(`${instituteName} Accounts`, 140, finalY + 71);

  // Bottom Notice
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an electronically generated receipt for your academy records. No physical signature required.', 15, 280);

  // Download trigger
  const fileName = `FeeReceipt_${student.studentCode}_${feeRecord.monthYear.replace(' ', '_')}.pdf`;
  doc.save(fileName);
}

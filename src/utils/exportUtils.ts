import { FeeRecord, Student, PaymentTransaction, Course, Batch } from '../types';

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        let str = String(val ?? '');
        str = str.replace(/"/g, '""');
        if (str.search(/("|,|\n)/g) >= 0) {
          str = `"${str}"`;
        }
        return str;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentsCSV(students: Student[], courses: Course[], batches: Batch[]) {
  const headers = [
    'Student ID',
    'Full Name',
    'Email',
    'Mobile',
    'WhatsApp',
    'Course',
    'Batch',
    'Joining Date',
    'Monthly Fee',
    'Membership Start',
    'Membership End',
    'Fee Due Day',
    'Status',
    'Address',
    'Notes'
  ];

  const rows = students.map((s) => {
    const course = courses.find((c) => c.id === s.courseId);
    const batch = batches.find((b) => b.id === s.batchId);
    return [
      s.studentCode,
      s.fullName,
      s.email,
      s.mobile,
      s.whatsapp,
      course?.name || 'N/A',
      batch?.name || 'N/A',
      s.joiningDate,
      s.monthlyFee,
      s.membershipStartDate,
      s.membershipEndDate,
      s.feeDueDay,
      s.status,
      s.address,
      s.notes || ''
    ];
  });

  exportToCSV(`Music_Students_Directory_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
}

export function exportFeeRecordsCSV(feeRecords: FeeRecord[], students: Student[]) {
  const headers = [
    'Invoice Number',
    'Student Code',
    'Student Name',
    'Month / Year',
    'Amount',
    'Due Date',
    'Payment Date',
    'Payment Method',
    'Transaction ID',
    'Status',
    'Late Fee',
    'Discount',
    'Notes'
  ];

  const rows = feeRecords.map((f) => {
    const student = students.find((s) => s.id === f.studentId);
    return [
      f.invoiceNumber,
      student?.studentCode || 'N/A',
      f.studentName,
      f.monthYear,
      f.amount,
      f.dueDate,
      f.paymentDate || 'Pending',
      f.paymentMethod || 'N/A',
      f.transactionId || 'N/A',
      f.status,
      f.lateFee || 0,
      f.discount || 0,
      f.notes || ''
    ];
  });

  exportToCSV(`Fee_Records_Report_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
}

export function exportTransactionsCSV(transactions: PaymentTransaction[]) {
  const headers = [
    'Receipt No',
    'Transaction Ref',
    'Student Name',
    'Amount',
    'Date & Time',
    'Type',
    'Method',
    'Status',
    'Notes'
  ];

  const rows = transactions.map((t) => [
    t.receiptNumber,
    t.transactionRef,
    t.studentName,
    t.amount,
    t.date,
    t.type,
    t.method,
    t.status,
    t.notes || ''
  ]);

  exportToCSV(`Payments_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
}

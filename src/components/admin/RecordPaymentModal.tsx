import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FeeRecord, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayString, formatCurrency, formatDateFull } from '../../utils/dateUtils';
import { CreditCard, CheckCircle2, DollarSign, Calendar, FileText, ArrowRight } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecord | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  feeRecord,
}) => {
  const { recordFeePayment, settings } = useApp();

  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [lateFee, setLateFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (feeRecord) {
      setAmount(feeRecord.amount);
      setLateFee(feeRecord.lateFee || 0);
      setDiscount(feeRecord.discount || 0);
      setPaymentDate(getTodayString());
      setTransactionId('TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase());
      setNotes(`Fee settlement for ${feeRecord.monthYear}`);
    }
  }, [feeRecord]);

  if (!feeRecord) return null;

  const totalCalculated = Math.max(0, amount + Number(lateFee) - Number(discount));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordFeePayment(feeRecord.id, {
      amount: totalCalculated,
      paymentDate,
      paymentMethod,
      transactionId: transactionId.trim() || undefined,
      notes: notes.trim() || undefined,
      lateFee: Number(lateFee) || undefined,
      discount: Number(discount) || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Record Fee Payment"
      subtitle={`Invoice #${feeRecord.invoiceNumber} • ${feeRecord.studentName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {/* Student & Invoice Summary Card */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Student</span>
            <span className="font-serif italic text-zinc-100 text-sm">
              {feeRecord.studentName}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Billing Period</span>
            <span className="font-serif text-zinc-100 text-sm">
              {feeRecord.monthYear}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Due Date</span>
            <span className="text-zinc-300 text-[11px]">
              {formatDateFull(feeRecord.dueDate)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Base Fee</span>
            <span className="text-zinc-300 text-[11px]">
              {formatCurrency(feeRecord.amount, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {/* Amount Paid */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Base Fee Amount ({settings.currencySymbol})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Payment Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash at Reception</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
              <option value="Card">Debit / Credit Card (POS)</option>
              <option value="Other">Other Mode</option>
            </select>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Transaction Ref / UTR
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UPI-991823901"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Late Fee */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Late Fee Penalty
            </label>
            <input
              type="number"
              min="0"
              value={lateFee || ''}
              onChange={(e) => setLateFee(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
              Discount Deduction
            </label>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Payment Notes / Remarks
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 pointer-events-none text-zinc-500">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full via GPay at front desk"
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Settlement Total Highlight Card */}
        <div className="p-4 bg-zinc-900 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
              Total Amount to Collect
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Base ({formatCurrency(amount, settings.currencySymbol)}) + Late Fee ({formatCurrency(lateFee || 0, settings.currencySymbol)}) - Discount ({formatCurrency(discount || 0, settings.currencySymbol)})
            </span>
          </div>
          <div className="text-2xl font-serif font-bold text-amber-400 tabular-nums">
            {formatCurrency(totalCalculated, settings.currencySymbol)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Record Payment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};

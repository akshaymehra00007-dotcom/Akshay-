import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Student, FeeRecord, InstituteSettings } from '../../types';
import {
  generateFeeWhatsAppMessage,
  generateOverdueWhatsAppMessage,
  generateMembershipWhatsAppMessage,
  createWhatsAppUrl,
} from '../../services/dueEngine';
import { Send, MessageSquare, Phone, User, Check, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  feeRecord?: FeeRecord | null;
  type: 'fee' | 'overdue' | 'membership' | 'custom';
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  student,
  feeRecord,
  type,
}) => {
  const { settings, membershipPlans, showToast } = useApp();
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!student) return;

    if (type === 'fee' && feeRecord) {
      setMessage(generateFeeWhatsAppMessage(student, feeRecord, settings));
    } else if (type === 'overdue' && feeRecord) {
      setMessage(generateOverdueWhatsAppMessage(student, feeRecord, settings));
    } else if (type === 'membership') {
      const plan = membershipPlans.find((p) => p.id === student.planId);
      setMessage(
        generateMembershipWhatsAppMessage(
          student,
          plan?.name || 'Academy Membership',
          settings
        )
      );
    } else {
      setMessage(
        `Hello ${student.fullName}, greetings from ${settings.instituteName}! We are reaching out regarding your music lessons.`
      );
    }
  }, [student, feeRecord, type, settings, membershipPlans]);

  if (!student) return null;

  const targetPhone = student.whatsapp || student.mobile;
  const whatsappUrl = createWhatsAppUrl(targetPhone, message);

  const handleSend = () => {
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    showToast(`WhatsApp reminder dispatched for ${student.fullName}`, 'success');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Message text copied to clipboard', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Send WhatsApp Reminder"
      subtitle={`Recipient: ${student.fullName} (${targetPhone})`}
    >
      <div className="space-y-4 font-sans">
        {/* Recipient Details Pill */}
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-200">
            <User className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-zinc-100">{student.fullName}</span>
            <span className="text-zinc-500">({student.studentCode})</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Phone className="w-3.5 h-3.5" />
            <span>{targetPhone}</span>
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
            Prepared Message (Review & Edit)
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-amber-500 transition-all font-sans"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

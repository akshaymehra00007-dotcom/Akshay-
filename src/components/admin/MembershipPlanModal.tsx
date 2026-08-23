import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { MembershipPlan } from '../../types';
import { useApp } from '../../context/AppContext';
import { Shield, DollarSign, Calendar, Percent, Check } from 'lucide-react';

interface MembershipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: MembershipPlan | null;
}

export const MembershipPlanModal: React.FC<MembershipPlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
}) => {
  const { addMembershipPlan, updateMembershipPlan } = useApp();

  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [price, setPrice] = useState<number>(7500);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name);
      setDurationMonths(planToEdit.durationMonths);
      setPrice(planToEdit.price);
      setDiscountPercent(planToEdit.discountPercent);
      setDescription(planToEdit.description);
      setIsPopular(!!planToEdit.isPopular);
    } else {
      setName('');
      setDurationMonths(3);
      setPrice(7500);
      setDiscountPercent(10);
      setDescription('');
      setIsPopular(false);
    }
  }, [planToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planToEdit) {
      updateMembershipPlan(planToEdit.id, {
        name: name.trim(),
        durationMonths: Number(durationMonths),
        price: Number(price),
        discountPercent: Number(discountPercent),
        description: description.trim(),
        isPopular,
      });
    } else {
      addMembershipPlan({
        name: name.trim(),
        durationMonths: Number(durationMonths),
        price: Number(price),
        discountPercent: Number(discountPercent),
        description: description.trim(),
        isPopular,
        active: true,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={planToEdit ? 'Edit Membership Plan' : 'Create Membership Plan'}
      subtitle="Define pricing tiers and student membership durations"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <div className="font-mono text-xs">
          <label className="block uppercase tracking-wider text-zinc-400 mb-1">
            Plan Title *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quarterly Sound Pass"
            required
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Duration (Months) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="1"
                max="60"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Plan Price (₹) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="100"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="block uppercase tracking-wider text-zinc-400 mb-1">
              Discount (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Percent className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span>Mark as "Featured"</span>
            </label>
          </div>
        </div>

        <div className="font-mono text-xs">
          <label className="block uppercase tracking-wider text-zinc-400 mb-1">
            Plan Description & Benefits
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Includes 3 months regular access + 2 free jam room booking hours"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 font-sans text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{planToEdit ? 'Save Changes' : 'Create Plan'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

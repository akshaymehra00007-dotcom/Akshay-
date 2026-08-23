import React from 'react';
import { FeeStatus, MembershipStatus } from '../../types';

interface BadgeProps {
  type: 'fee' | 'membership' | 'status' | 'custom';
  value: FeeStatus | MembershipStatus | 'active' | 'inactive' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  type: _type,
  value,
  size = 'md',
  className = '',
  showDot = true,
}) => {
  const v = String(value).toUpperCase();

  let bgClass = 'bg-zinc-900 text-zinc-300 border-zinc-700';
  let dotClass = 'bg-zinc-500';

  if (v === 'PAID' || v === 'ACTIVE') {
    bgClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
    dotClass = 'bg-emerald-400';
  } else if (v === 'UPCOMING') {
    bgClass = 'bg-zinc-900 text-zinc-300 border-zinc-700';
    dotClass = 'bg-zinc-400';
  } else if (v === 'DUE TODAY' || v === 'EXPIRING TODAY') {
    bgClass = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
    dotClass = 'bg-amber-400 animate-pulse';
  } else if (v === 'EXPIRING SOON') {
    bgClass = 'bg-amber-950/60 text-amber-300 border-amber-800/70';
    dotClass = 'bg-amber-400';
  } else if (v === 'OVERDUE' || v === 'EXPIRED' || v === 'INACTIVE') {
    bgClass = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
    dotClass = 'bg-rose-400';
  }

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 font-semibold font-mono uppercase tracking-wider gap-1',
    md: 'text-[10px] px-2.5 py-1 font-semibold font-mono uppercase tracking-wider gap-1.5',
    lg: 'text-xs px-3 py-1.5 font-bold font-mono uppercase tracking-wider gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap shrink-0 transition-colors ${sizeClasses} ${bgClass} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      )}
      <span>{value}</span>
    </span>
  );
};


import React from 'react';
import { ShipmentStatus } from '@/models/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'shipped' | 'delivered' | 'returned' | 'walkin' | 'neutral' | 'success' | 'warning' | 'danger' | 'gold';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
  };

  const variants = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200/80',
    shipped: 'bg-blue-100 text-blue-800 border border-blue-200/80',
    delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200/80',
    returned: 'bg-rose-100 text-rose-800 border border-rose-200/80',
    walkin: 'bg-[#E6F9FC] text-[#008A9D] border border-[#DDD6FE]',
    gold: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full leading-none tracking-tight select-none ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ShipmentStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<ShipmentStatus, BadgeProps['variant']> = {
    Pending: 'pending',
    Shipped: 'shipped',
    Delivered: 'delivered',
    Returned: 'returned',
    Unfinal: 'warning',
  };
  return (
    <Badge variant={map[status] || 'neutral'} className={className}>
      {status}
    </Badge>
  );
};

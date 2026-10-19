import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: {
    positive?: boolean;
    text: string;
  };
  dataTestId?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBg = 'bg-slate-100 text-slate-700',
  trend,
  dataTestId,
}) => {
  return (
    <div
      data-testid={dataTestId}
      className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card hover:shadow-cardHover transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="mono text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-900 mt-1 leading-tight break-words">
            {value}
          </div>
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        {trend ? (
          <span
            className={
              trend.positive === true
                ? 'text-emerald-600 flex items-center gap-1 font-bold'
                : trend.positive === false
                ? 'text-red-600 flex items-center gap-1 font-bold'
                : 'text-slate-500'
            }
          >
            {trend.text}
          </span>
        ) : subtext ? (
          <span className="text-slate-500">{subtext}</span>
        ) : (
          <span className="text-slate-400">&bull; Live tracking</span>
        )}
      </div>
    </div>
  );
};

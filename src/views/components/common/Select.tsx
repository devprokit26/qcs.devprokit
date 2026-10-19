import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  options,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-bold text-slate-800 tracking-tight select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-red-500 font-semibold">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#292929]/20 focus:border-[#292929] transition-colors cursor-pointer ${
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
        } ${className}`}
        {...props}
      >
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <span className="text-[11px] font-medium text-red-600 mt-0.5">{error}</span>}
      {hint && !error && (
        <span className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">{hint}</span>
      )}
    </div>
  );
};

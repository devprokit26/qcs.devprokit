import React, { useEffect, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

function toDisplay(value: InputProps['value']): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' && isNaN(value)) return '';
  return String(value);
}

/**
 * Shared text / number input.
 *
 * Number fields keep their own "draft" text while the user types. This means a
 * default like 0, 30 or 500000 can always be fully removed with Backspace —
 * even when the parent form converts the value to a number (e.g. "" → 0) —
 * instead of the old value snapping straight back into the box.
 */
export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  className = '',
  id,
  type,
  value,
  onChange,
  onWheel,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isNumber = type === 'number' && value !== undefined;

  const [draft, setDraft] = useState<string>(toDisplay(value));
  const minimum = type === 'number' ? (props.min === undefined ? 0 : Number(props.min)) : undefined;

  // Keep the draft in sync when the parent changes the value (form reset,
  // edit mode, etc.) — but don't fight the user while they are typing.
  useEffect(() => {
    if (!isNumber) return;
    const external = toDisplay(value);
    setDraft(prev => {
      if (prev === external) return prev;
      if (external === '') return '';
      // Same numeric value (e.g. user cleared the box and parent stored 0,
      // or user typed "5." and parent stored 5) → keep what the user sees.
      if (prev.trim() !== '' && Number(prev) === Number(external)) return prev;
      if (prev.trim() === '' && Number(external) === 0) return prev;
      return external;
    });
  }, [value, isNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber && minimum !== undefined && Number.isFinite(minimum) && minimum >= 0 && e.target.value.startsWith('-')) {
      e.currentTarget.value = draft;
      return;
    }
    if (isNumber) setDraft(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-800 tracking-tight select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-red-500 font-semibold">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        min={type === 'number' ? (props.min ?? 0) : props.min}
        value={isNumber ? draft : value}
        onChange={handleChange}
        // Stop the mouse wheel from silently changing number fields while scrolling the form
        onWheel={e => {
          if (type === 'number') (e.currentTarget as HTMLInputElement).blur();
          onWheel?.(e);
        }}
        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#292929]/20 focus:border-[#292929] transition-colors ${
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[11px] font-medium text-red-600 mt-0.5">{error}</span>}
      {hint && !error && (
        <span className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">{hint}</span>
      )}
    </div>
  );
};

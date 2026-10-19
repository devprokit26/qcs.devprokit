import React from 'react';
import { COMPANY } from '@/utils/branding';

interface LogoProps {
  variant?: 'full' | 'sidebar' | 'mark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '' }) => {
  if (variant === 'mark') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src="/logo.png"
          alt={`${COMPANY.network} logo`}
          className="w-12 h-10 object-contain drop-shadow"
        />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src="/logo.png"
          alt={`${COMPANY.network} logo`}
          className="h-10 w-[72px] rounded-md bg-white p-1 object-contain flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-black tracking-tight text-white leading-tight font-sans">
            {COMPANY.name}
          </div>
          <div className="text-[9px] text-[#24C5D8] font-extrabold tracking-tight truncate">
            {COMPANY.network}
          </div>
        </div>
      </div>
    );
  }

  // Full Hero Variant (for Login Screen / Documents)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="w-56 max-w-full flex items-center justify-center">
        <img
          src="/logo.png"
          alt={`${COMPANY.network} logo`}
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="mt-2 text-base font-black text-[#292929]">{COMPANY.name}</div>
    </div>
  );
};

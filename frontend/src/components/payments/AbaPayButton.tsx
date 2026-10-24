'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface AbaPayButtonProps {
  href?: string;
  onClick?: () => void;
  labelKh?: string;
  labelEn?: string;
  sublabelKh?: string;
  sublabelEn?: string;
  isKm?: boolean;
  disabled?: boolean;
  className?: string;
  showIconOnly?: boolean;
}

export const AbaPayButton: React.FC<AbaPayButtonProps> = ({
  href,
  onClick,
  labelKh = 'ទូទាត់តាម ABA Mobile',
  labelEn = 'Pay with ABA Mobile',
  sublabelKh = 'ABA Pay - រហ័ស និងសុវត្ថិភាព',
  sublabelEn = 'Instant & Secure Settlement',
  isKm = true,
  disabled = false,
  className = '',
  showIconOnly = false,
}) => {
  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 flex items-center justify-center p-0.5 rounded-md bg-[#00475E]/60 border border-white/20 shadow-2xs">
          <img
            src="/images/aba-pay.svg"
            alt="ABA Pay"
            className="h-6 w-auto block select-none"
            loading="lazy"
          />
        </div>

        {!showIconOnly && (
          <div className="text-left overflow-hidden">
            <div className="text-xs font-bold leading-tight truncate text-white tracking-wide">
              {isKm ? labelKh : labelEn}
            </div>
            <div className="text-[10px] text-cyan-200/90 leading-tight font-medium truncate mt-0.5">
              {isKm ? sublabelKh : sublabelEn}
            </div>
          </div>
        )}
      </div>

      {!showIconOnly && (
        <ExternalLink className="w-3.5 h-3.5 text-cyan-200 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
      )}
    </>
  );

  const baseClasses = `inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#055E7C] hover:bg-[#03455B] active:bg-[#023344] text-white shadow-xs hover:shadow-md border border-[#00475E] transition-all group select-none ${
    disabled ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'
  } ${className}`;

  if (href && !disabled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        className={baseClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  );
};

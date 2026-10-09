'use client';

import React from 'react';

interface ClinicLogoProps {
  variant?: 'navbar' | 'full' | 'icon' | 'print' | 'sidebar';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const ClinicLogo: React.FC<ClinicLogoProps> = ({
  variant = 'navbar',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const getIconDimensions = () => {
    switch (size) {
      case 'sm':
        return 'w-7 h-7';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      case 'md':
      default:
        return 'w-9 h-9';
    }
  };

  const EmblemSvg = ({ isPrint = false }: { isPrint?: boolean }) => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xs"
    >
      <defs>
        <linearGradient id="rotanaTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#1e293b' : '#0f766e'} />
          <stop offset="100%" stopColor={isPrint ? '#0f172a' : '#042f2e'} />
        </linearGradient>
        <linearGradient id="rotanaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#475569' : '#f59e0b'} />
          <stop offset="100%" stopColor={isPrint ? '#334155' : '#d97706'} />
        </linearGradient>
        <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Protective Shield Shield Base */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill="url(#rotanaTealGrad)"
      />
      <rect
        x="9"
        y="9"
        width="102"
        height="102"
        rx="25"
        stroke="url(#rotanaGoldGrad)"
        strokeWidth="2"
        strokeOpacity={isPrint ? '0.4' : '0.65'}
      />

      {/* Inner Medical Cross Silhouette */}
      <path
        d="M50 28H70V50H92V70H70V92H50V70H28V50H50V28Z"
        fill="#ffffff"
        fillOpacity="0.12"
      />

      {/* Caduceus Rod of Asclepius with Gentle Serpent & Heartbeat Wave */}
      {/* Central Staff */}
      <line
        x1="60"
        y1="24"
        x2="60"
        y2="96"
        stroke="url(#rotanaGoldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="60" cy="22" r="5" fill="url(#rotanaGoldGrad)" />

      {/* Double Caduceus Wings / Coils */}
      <path
        d="M42 42C42 42 54 36 60 48C66 60 78 54 78 54"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M78 42C78 42 66 36 60 48C54 60 42 54 42 54"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M45 68C45 68 54 62 60 72C66 82 75 76 75 76"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clinical ECG Pulse Line running horizontally through center */}
      <path
        d="M20 60H44L49 52L54 70L60 46L66 74L71 56L76 60H100"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#subtleGlow)"
      />

      {/* Small Star of Excellence at base */}
      <circle cx="60" cy="98" r="2.5" fill="#f59e0b" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`relative shrink-0 ${getIconDimensions()} ${className}`}>
        <EmblemSvg />
      </div>
    );
  }

  if (variant === 'print') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <div className="w-12 h-12 shrink-0">
          <EmblemSvg isPrint={true} />
        </div>
        <div className="text-left">
          <div className="text-[13px] font-bold text-slate-900 leading-tight tracking-wide font-sans">
            មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា
          </div>
          <div className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
            ROTANA MEDICAL CENTER & POLYCLINIC
          </div>
          <div className="text-[10px] text-slate-500 font-sans mt-0.5">
            Ministry of Health Reg. No: MOH-KHM-2026-9908 • 24/7 Outpatient & Emergency
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-3 px-3 py-3 border-b border-slate-100 ${className}`}>
        <div className="w-10 h-10 shrink-0">
          <EmblemSvg />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 truncate leading-tight">
            មជ្ឈមណ្ឌល រតនា
          </div>
          <div className="text-[11px] font-bold text-teal-800 font-mono tracking-tight truncate">
            ROTANA CLINIC
          </div>
          <div className="text-[10px] text-slate-400 truncate">Smart Health & KHQR</div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className={`mb-3 ${getIconDimensions()}`}>
          <EmblemSvg />
        </div>
        <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា
        </div>
        <div className="text-xs sm:text-sm font-semibold text-teal-800 font-mono tracking-wider uppercase mt-0.5">
          ROTANA MEDICAL CENTER
        </div>
        {showSubtitle && (
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs">
            ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក & សុខាភិបាលឌីជីថល (Clinical Healthcare & KHQR Bridge)
          </p>
        )}
      </div>
    );
  }

  // Default navbar variant
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div className={`${getIconDimensions()} shrink-0`}>
        <EmblemSvg />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 leading-tight text-xs sm:text-sm tracking-tight truncate">
            មជ្ឈមណ្ឌល រតនា
          </span>
          <span className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-[9px] font-mono font-bold text-teal-800 uppercase">
            POLYCLINIC
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight hidden min-[400px]:block truncate max-w-[150px]">
          Rotana Medical
        </div>
      </div>
    </div>
  );
};

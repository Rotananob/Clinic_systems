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
      className="w-full h-full drop-shadow-sm select-none"
    >
      <defs>
        <linearGradient id="genzBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#0f172a' : '#031c19'} />
          <stop offset="100%" stopColor={isPrint ? '#020617' : '#063f39'} />
        </linearGradient>
        <linearGradient id="genzMintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#ffffff' : '#34d399'} />
          <stop offset="100%" stopColor={isPrint ? '#e2e8f0' : '#059669'} />
        </linearGradient>
        <linearGradient id="genzAccentSpark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#94a3b8' : '#6ee7b7'} />
          <stop offset="100%" stopColor={isPrint ? '#64748b' : '#10b981'} />
        </linearGradient>
      </defs>

      {/* Human-Crafted Modern Squircle Container */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="30"
        fill="url(#genzBaseGrad)"
      />
      <rect
        x="6.75"
        y="6.75"
        width="106.5"
        height="106.5"
        rx="29.25"
        stroke={isPrint ? '#334155' : '#10b981'}
        strokeWidth="1.5"
        strokeOpacity={isPrint ? '0.4' : '0.22'}
      />

      {/* Gen-Z Minimalist Monogram: Interlocking 'H' + 'V' Kinetic Medical Plus */}
      {/* 1. Dynamic 'V' Foundation with curved apex */}
      <path
        d="M36 32V60C36 73.25 46.75 84 60 84C73.25 84 84 73.25 84 60V32"
        stroke="url(#genzMintGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Precision Crossbar forming the 'H' and horizontal beam of '+' */}
      <line
        x1="22"
        y1="50"
        x2="98"
        y2="50"
        stroke={isPrint ? '#ffffff' : '#ffffff'}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* 3. Vertical Health Pillar completing the '+' beacon */}
      <line
        x1="60"
        y1="22"
        x2="60"
        y2="50"
        stroke="url(#genzAccentSpark)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* 4. Center Optical Aperture Point */}
      <circle
        cx="60"
        cy="50"
        r="4"
        fill={isPrint ? '#0f172a' : '#031c19'}
      />

      {/* 5. Minimalist Gen-Z Vitality Spark */}
      <circle
        cx="60"
        cy="96"
        r="2.5"
        fill={isPrint ? '#94a3b8' : '#34d399'}
      />
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
            មន្ទីរសម្រាកព្យាបាល ហួន វណ្ណៈ
          </div>
          <div className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
            HOUN VANNAK MEDICAL CLINIC & POLYCLINIC
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
            ពេទ្យ ហួន វណ្ណៈ
          </div>
          <div className="text-[11px] font-bold text-teal-800 font-mono tracking-tight truncate">
            HOUN VANNAK CLINIC
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
          មន្ទីរសម្រាកព្យាបាល ហួន វណ្ណៈ
        </div>
        <div className="text-xs sm:text-sm font-semibold text-teal-800 font-mono tracking-wider uppercase mt-0.5">
          HOUN VANNAK MEDICAL CLINIC
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
            ពេទ្យ ហួន វណ្ណៈ
          </span>
          <span className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-[9px] font-mono font-bold text-teal-800 uppercase">
            CLINIC
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight hidden min-[400px]:block truncate max-w-[150px]">
          Houn Vannak Medical
        </div>
      </div>
    </div>
  );
};

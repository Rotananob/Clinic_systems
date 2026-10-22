'use client';

import React, { useState } from 'react';

export interface ClinicLogoProps {
  variant?: 'navbar' | 'full' | 'icon' | 'print' | 'sidebar' | 'hero3d';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showSubtitle?: boolean;
  clinicNameKh?: string;
  clinicNameEn?: string;
  planTier?: string;
  interactive?: boolean;
}

export const ClinicLogo: React.FC<ClinicLogoProps> = ({
  variant = 'navbar',
  size = 'md',
  className = '',
  showSubtitle = true,
  clinicNameKh,
  clinicNameEn,
  planTier,
  interactive = true,
}) => {
  const [resolvedNames, setResolvedNames] = useState({
    kh: clinicNameKh || '',
    en: clinicNameEn || '',
    tier: planTier || '',
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  React.useEffect(() => {
    if (clinicNameKh || clinicNameEn) {
      setResolvedNames({
        kh: clinicNameKh || '',
        en: clinicNameEn || '',
        tier: planTier || '',
      });
      return;
    }
    const updateFromStorage = () => {
      try {
        const userStr = localStorage.getItem('clinic_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u?.tenant) {
            setResolvedNames({
              kh: u.tenant.clinicNameKh || '',
              en: u.tenant.clinicNameEn || '',
              tier: u.tenant.planTier || '',
            });
            return;
          }
        }
        const settingsStr = localStorage.getItem('houn_vannak_clinic_settings_v1');
        if (settingsStr) {
          const s = JSON.parse(settingsStr);
          setResolvedNames({
            kh: s.clinicNameKh || '',
            en: s.clinicNameEn || '',
            tier: '',
          });
        }
      } catch {}
    };

    updateFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('clinic_profile_updated', updateFromStorage);
      return () => window.removeEventListener('clinic_profile_updated', updateFromStorage);
    }
  }, [clinicNameKh, clinicNameEn, planTier]);

  const displayNameKh = resolvedNames.kh || 'Krupet មន្ទីរសម្រាកព្យាបាល';
  const displayNameEn = resolvedNames.en || 'Krupet Medical Center';
  const displayTier = resolvedNames.tier ? resolvedNames.tier.replace('_', ' ') : 'KRUPET';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return 'w-7 h-7';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      case 'hero':
        return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'md':
      default:
        return 'w-9 h-9 sm:w-10 sm:h-10';
    }
  };

  const EmblemSvg = ({ isPrint = false }: { isPrint?: boolean }) => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none transform-gpu"
    >
      <defs>
        {/* Deep Medical Teal Gradient Base */}
        <linearGradient id="xcBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#0f172a' : '#03201C'} />
          <stop offset="50%" stopColor={isPrint ? '#020617' : '#063B34'} />
          <stop offset="100%" stopColor={isPrint ? '#000000' : '#041815'} />
        </linearGradient>

        {/* Dynamic X Facet A */}
        <linearGradient id="xcFacetA" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#475569' : '#14B8A6'} />
          <stop offset="50%" stopColor={isPrint ? '#334155' : '#0D9488'} />
          <stop offset="100%" stopColor={isPrint ? '#1e293b' : '#064E3B'} />
        </linearGradient>

        {/* Dynamic X Facet B */}
        <linearGradient id="xcFacetB" x1="80%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#94a3b8' : '#2DD4BF'} />
          <stop offset="50%" stopColor={isPrint ? '#64748b' : '#10B981'} />
          <stop offset="100%" stopColor={isPrint ? '#334155' : '#047857'} />
        </linearGradient>

        {/* Luminous Medical Cross Core */}
        <linearGradient id="xcCoreCross" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#ffffff' : '#FFFFFF'} />
          <stop offset="100%" stopColor={isPrint ? '#cbd5e1' : '#ECFDF5'} />
        </linearGradient>

        {/* Glowing Pulse Neon Line */}
        <linearGradient id="xcPulseLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isPrint ? '#ffffff' : '#A7F3D0'} />
          <stop offset="45%" stopColor={isPrint ? '#ffffff' : '#34D399'} />
          <stop offset="70%" stopColor={isPrint ? '#ffffff' : '#10B981'} />
          <stop offset="100%" stopColor={isPrint ? '#cbd5e1' : '#6EE7B7'} />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="xcGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isPrint ? '0' : '2.5'} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft Radial Core Light */}
        <radialGradient id="xcRadialBacklight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isPrint ? '#334155' : '#10B981'} stopOpacity={isPrint ? '0.1' : '0.28'} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 3D Drop Shadow Backplate */}
      <rect
        x="6"
        y="8"
        width="108"
        height="108"
        rx="28"
        fill="#020E0D"
        opacity="0.6"
      />

      {/* Outer Squircle Chassis */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill="url(#xcBaseGrad)"
      />

      {/* Radial Backlight in Center */}
      <circle cx="60" cy="60" r="44" fill="url(#xcRadialBacklight)" />

      {/* Chamfered Inner Bevel Border */}
      <rect
        x="7.5"
        y="7.5"
        width="105"
        height="105"
        rx="26.5"
        stroke="url(#xcPulseLine)"
        strokeWidth="1.5"
        strokeOpacity={isPrint ? '0.4' : '0.35'}
      />

      {/* Micro-Precision Biometric Corner Marks */}
      <line x1="18" y1="24" x2="24" y2="24" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="24" y1="18" x2="24" y2="24" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />

      <line x1="102" y1="24" x2="96" y2="24" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="96" y1="18" x2="96" y2="24" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />

      <line x1="18" y1="96" x2="24" y2="96" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="24" y1="102" x2="24" y2="96" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />

      <line x1="102" y1="96" x2="96" y2="96" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="96" y1="102" x2="96" y2="96" stroke="#34D399" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* ============================================================== */}
      {/* Dynamic Faceted "X" Emblem Structure */}
      {/* Diagonal Arm 1: Top-Left to Bottom-Right */}
      <path
        d="M 31 28 L 47 28 L 89 92 L 73 92 Z"
        fill="url(#xcFacetA)"
        opacity="0.95"
      />

      {/* Diagonal Arm 2: Top-Right to Bottom-Left (with 3D depth notch) */}
      <path
        d="M 89 28 L 73 28 L 31 92 L 47 92 Z"
        fill="url(#xcFacetB)"
        opacity="0.95"
      />

      {/* Subtle Facet Bevel Highlight Line */}
      <line
        x1="33"
        y1="30"
        x2="87"
        y2="90"
        stroke="#5EEAD4"
        strokeWidth="1.2"
        strokeOpacity="0.3"
      />

      {/* ============================================================== */}
      {/* 3D Medical Cross Core Element */}
      {/* Vertical Cross Bar */}
      <rect
        x="53"
        y="30"
        width="14"
        height="60"
        rx="5"
        fill="url(#xcCoreCross)"
        filter="url(#xcGlowFilter)"
      />

      {/* Horizontal Cross Bar */}
      <rect
        x="30"
        y="53"
        width="60"
        height="14"
        rx="5"
        fill="url(#xcCoreCross)"
        filter="url(#xcGlowFilter)"
      />

      {/* ============================================================== */}
      {/* Vital Pulse (EKG) Cardiogram Wave Overlay */}
      <path
        d="M 22 60 L 40 60 L 47 48 L 54 72 L 61 38 L 68 76 L 74 52 L 79 60 L 98 60"
        stroke="url(#xcPulseLine)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#xcGlowFilter)"
      />

      {/* Center Heartbeat Luminescence Node */}
      <circle
        cx="61"
        cy="38"
        r="3.5"
        fill="#FFFFFF"
        filter="url(#xcGlowFilter)"
      />
      <circle
        cx="61"
        cy="38"
        r="1.5"
        fill="#10B981"
      />

      {/* Top Precision AI Satellite Node */}
      <circle
        cx="94"
        cy="26"
        r="4"
        fill="#34D399"
        filter="url(#xcGlowFilter)"
      />
      <circle
        cx="94"
        cy="26"
        r="2"
        fill="#FFFFFF"
      />
    </svg>
  );

  // Icon Variant
  if (variant === 'icon') {
    return (
      <div
        className={`relative shrink-0 ${getDimensions()} ${className}`}
        style={{
          transform: isHovered && interactive ? `perspective(600px) rotateX(${mousePos.y * 0.4}deg) rotateY(${mousePos.x * 0.4}deg)` : 'none',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <EmblemSvg />
      </div>
    );
  }

  // Print Slip Variant (Thermal 80mm & A4)
  if (variant === 'print') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <div className="w-12 h-12 shrink-0">
          <EmblemSvg isPrint={true} />
        </div>
        <div className="text-left">
          <div className="text-[13px] font-bold text-slate-900 leading-tight tracking-wide font-sans">
            {displayNameKh}
          </div>
          <div className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
            {displayNameEn}
          </div>
          <div className="text-[10px] text-slate-500 font-sans mt-0.5">
            Ministry of Health Registered Medical Workspace - 24/7 Outpatient & Emergency
          </div>
        </div>
      </div>
    );
  }

  // Sidebar Variant
  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-3 px-3.5 py-3 border-b border-[#E7E0D2] bg-[#FAF7F2] ${className}`}>
        <div className="w-10 h-10 shrink-0">
          <EmblemSvg />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-stone-900 truncate tracking-tight font-sans">
              KRUPET
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
              PaaS
            </span>
          </div>
          <div className="text-[11px] font-bold text-teal-900 truncate leading-tight font-sans mt-0.5">
            {displayNameKh}
          </div>
          <div className="text-[10px] text-stone-500 truncate font-mono">
            {displayNameEn}
          </div>
        </div>
      </div>
    );
  }

  // Full Hero 3D Variant
  if (variant === 'hero3d' || variant === 'full') {
    return (
      <div
        className={`flex flex-col items-center text-center ${className}`}
        style={{
          transform: isHovered && interactive ? `perspective(800px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)` : 'none',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`relative mb-3.5 ${getDimensions()} group cursor-pointer`}>
          <EmblemSvg />
          {/* Subtle Ambient Backlight Sheen */}
          <div className="absolute inset-0 rounded-3xl bg-teal-500/20 blur-xl -z-10 group-hover:bg-teal-400/30 transition-all duration-300 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight font-sans">
            <span className="text-teal-800">Kru</span>pet<span className="text-teal-600 text-xs font-bold">.com</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-teal-900 text-teal-100 border border-teal-700 shadow-xs">
            PaaS 2.0
          </span>
        </div>

        <div className="text-xs sm:text-sm font-bold text-stone-800 font-sans mt-1">
          {displayNameKh}
        </div>
        <div className="text-[11px] font-semibold text-teal-800 font-mono tracking-wider uppercase mt-0.5">
          {displayNameEn}
        </div>

        {showSubtitle && (
          <p className="text-[11px] sm:text-xs text-stone-500 mt-2 max-w-sm leading-relaxed">
            ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក និងសុខាភិបាលឌីជីថលជំនាន់ថ្មី ភ្ជាប់ជាមួយ Dynamic KHQR ចាក់សោទឹកប្រាក់ និង AI វេជ្ជសាស្ត្រជំនាន់ក្រោយដ៏វ័យឆ្លាត
          </p>
        )}
      </div>
    );
  }

  // Default Navbar Variant
  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 group cursor-pointer ${className}`}
      style={{
        transform: isHovered && interactive ? `perspective(600px) rotateX(${mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)` : 'none',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`${getDimensions()} shrink-0 relative transition-transform duration-200 group-hover:scale-105`}>
        <EmblemSvg />
        <div className="absolute inset-0 rounded-2xl bg-teal-500/10 blur-md -z-10 group-hover:bg-teal-500/25 transition-all" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-stone-900 leading-tight text-sm sm:text-base tracking-tight font-sans">
            <span className="text-teal-800">Kru</span>pet<span className="text-teal-600 text-sm sm:text-base font-bold">.com</span>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-[9px] font-mono font-bold text-teal-800 uppercase">
            {displayTier}
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-stone-500 font-medium leading-tight truncate max-w-[160px] sm:max-w-[210px] mt-0.5">
          {displayNameKh}
        </div>
      </div>
    </div>
  );
};

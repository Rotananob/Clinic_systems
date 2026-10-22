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
        {/* Deep Heritage Medical Teal Base Chassis */}
        <linearGradient id="kpBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#0f172a' : '#021C19'} />
          <stop offset="45%" stopColor={isPrint ? '#020617' : '#063D36'} />
          <stop offset="100%" stopColor={isPrint ? '#000000' : '#011412'} />
        </linearGradient>

        {/* Outer Chamfer Bevel Glow */}
        <linearGradient id="kpBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#475569' : '#2DD4BF'} stopOpacity="0.6" />
          <stop offset="50%" stopColor={isPrint ? '#334155' : '#10B981'} stopOpacity="0.25" />
          <stop offset="100%" stopColor={isPrint ? '#1e293b' : '#047857'} stopOpacity="0.5" />
        </linearGradient>

        {/* K Pillar & Cross Stem Gradient */}
        <linearGradient id="kpPillarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#334155' : '#14B8A6'} />
          <stop offset="50%" stopColor={isPrint ? '#1e293b' : '#0D9488'} />
          <stop offset="100%" stopColor={isPrint ? '#0f172a' : '#047857'} />
        </linearGradient>

        {/* Upper K Diagonal Arm Gradient */}
        <linearGradient id="kpArmUpper" x1="20%" y1="100%" x2="90%" y2="0%">
          <stop offset="0%" stopColor={isPrint ? '#475569' : '#10B981'} />
          <stop offset="50%" stopColor={isPrint ? '#64748b' : '#2DD4BF'} />
          <stop offset="100%" stopColor={isPrint ? '#94a3b8' : '#5EEAD4'} />
        </linearGradient>

        {/* Lower K Diagonal Leg Gradient */}
        <linearGradient id="kpArmLower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isPrint ? '#334155' : '#0D9488'} />
          <stop offset="70%" stopColor={isPrint ? '#1e293b' : '#065F46'} />
          <stop offset="100%" stopColor={isPrint ? '#0f172a' : '#022C22'} />
        </linearGradient>

        {/* Luminous Surgical White Medical Cross Core */}
        <linearGradient id="kpSurgicalCross" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={isPrint ? '#cbd5e1' : '#F0FDF4'} />
        </linearGradient>

        {/* Vital Pulse (EKG) Line */}
        <linearGradient id="kpPulseLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isPrint ? '#0f172a' : '#059669'} />
          <stop offset="35%" stopColor={isPrint ? '#334155' : '#0F766E'} />
          <stop offset="50%" stopColor={isPrint ? '#475569' : '#14B8A6'} />
          <stop offset="70%" stopColor={isPrint ? '#334155' : '#0F766E'} />
          <stop offset="100%" stopColor={isPrint ? '#0f172a' : '#059669'} />
        </linearGradient>

        {/* Ambient Backlight in Core */}
        <radialGradient id="kpBacklight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isPrint ? '#334155' : '#10B981'} stopOpacity={isPrint ? '0.08' : '0.32'} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Drop Shadow Filter */}
        <filter id="kpEmblemShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity={isPrint ? '0.2' : '0.55'} />
        </filter>

        {/* Core Luminescence Filter */}
        <filter id="kpCoreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation={isPrint ? '0' : '2'} flood-color="#34D399" flood-opacity={isPrint ? '0' : '0.6'} />
        </filter>
      </defs>

      {/* 1. Base Drop Shadow Plate */}
      <rect x="6" y="8" width="108" height="108" rx="28" fill="#010D0C" opacity={isPrint ? '0.2' : '0.65'} />

      {/* 2. Human-Crafted Squircle Container Chassis */}
      <rect x="6" y="6" width="108" height="108" rx="28" fill="url(#kpBaseGrad)" />
      <circle cx="60" cy="60" r="46" fill="url(#kpBacklight)" />
      <rect x="7.5" y="7.5" width="105" height="105" rx="26.5" stroke="url(#kpBevelGrad)" strokeWidth="1.5" />

      {/* 3. Architect Grid Precision Corner Crosshairs (Human Draft Marks) */}
      <line x1="16" y1="22" x2="22" y2="22" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="22" y1="16" x2="22" y2="22" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="104" y1="22" x2="98" y2="22" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="98" y1="16" x2="98" y2="22" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="16" y1="98" x2="22" y2="98" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="22" y1="104" x2="22" y2="98" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="104" y1="98" x2="98" y2="98" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />
      <line x1="98" y1="104" x2="98" y2="98" stroke="#34D399" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.35'} />

      {/* 4. OFFICIAL KRUPET CAPITAL "K" MONOGRAM WITH MEDICAL CROSS & PULSE */}
      <g filter={isPrint ? undefined : 'url(#kpEmblemShadow)'}>
        {/* (A) Vertical Pillar Stem of K */}
        <rect x="28" y="26" width="16" height="68" rx="4.5" fill="url(#kpPillarGrad)" />
        <line x1="31" y1="29" x2="31" y2="91" stroke="#5EEAD4" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.4'} />

        {/* (B) Upper Diagonal Arm of K (Ascending to 90, 26) */}
        <path d="M 42 56 L 72 26 L 90 26 L 56 66 Z" fill="url(#kpArmUpper)" />
        <line x1="45" y1="54" x2="88" y2="28" stroke="#A7F3D0" strokeWidth="1.4" strokeOpacity={isPrint ? '0.3' : '0.6'} />

        {/* (C) Lower Diagonal Leg of K (Grounding to 92, 94) */}
        <path d="M 48 58 L 72 94 L 92 94 L 62 50 Z" fill="url(#kpArmLower)" />
        <line x1="51" y1="61" x2="88" y2="92" stroke="#2DD4BF" strokeWidth="1.2" strokeOpacity={isPrint ? '0.2' : '0.4'} />

        {/* (D) Integrated Healthcare Motif: Embedded Medical Cross Bar */}
        <rect x="16" y="52" width="40" height="16" rx="4" fill="url(#kpPillarGrad)" />
        <rect x="28" y="44" width="16" height="32" rx="4" fill="url(#kpPillarGrad)" />

        {/* (E) Luminous Surgical White Medical Cross Inset Core */}
        <rect x="19" y="55" width="34" height="10" rx="2.5" fill="url(#kpSurgicalCross)" filter={isPrint ? undefined : 'url(#kpCoreGlow)'} />
        <rect x="31" y="47" width="10" height="26" rx="2.5" fill="url(#kpSurgicalCross)" filter={isPrint ? undefined : 'url(#kpCoreGlow)'} />

        {/* (F) Precision Cardiogram Vital Pulse Line */}
        <path
          d="M 18 60 L 25 60 L 29 52 L 34 68 L 38 54 L 42 60 L 52 60"
          stroke="url(#kpPulseLine)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* (G) Vital Spark Center Node */}
        <circle cx="34" cy="68" r="2.8" fill="#FFFFFF" filter={isPrint ? undefined : 'url(#kpCoreGlow)'} />
        <circle cx="34" cy="68" r="1.4" fill="#059669" />

        {/* (H) Apex Diamond Beacon Accent */}
        <polygon points="86,22 88,26 92,26 89,29 90,33 86,30 82,33 83,29 80,26 84,26" fill={isPrint ? '#64748b' : '#FDE68A'} opacity={isPrint ? '0.5' : '0.85'} />
      </g>
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

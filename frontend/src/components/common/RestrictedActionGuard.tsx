'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { usePermissionModal } from '../../context/PermissionModalContext';
import { useTranslation } from '../../context/I18nContext';

interface RestrictedActionGuardProps {
  isAllowed: boolean;
  actionNameKh: string;
  actionNameEn: string;
  customMessage?: string;
  children: React.ReactNode;
  className?: string;
  showLockIcon?: boolean;
}

export const RestrictedActionGuard: React.FC<RestrictedActionGuardProps> = ({
  isAllowed,
  actionNameKh,
  actionNameEn,
  customMessage,
  children,
  className = '',
  showLockIcon = true,
}) => {
  const { openRestrictedModal } = usePermissionModal();
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  if (isAllowed) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openRestrictedModal({
      actionName: isKm ? actionNameKh : actionNameEn,
      message: customMessage,
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`relative inline-block opacity-45 grayscale contrast-75 cursor-pointer select-none transition-all hover:opacity-75 ${className}`}
      title={isKm ? `សិទ្ធិត្រូវបានកំណត់៖ ${actionNameKh}` : `Restricted: ${actionNameEn}`}
    >
      <div className="pointer-events-none">
        {children}
      </div>
      {showLockIcon && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center shadow-xs border border-white z-20">
          <Lock className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
};

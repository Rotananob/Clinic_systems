'use client';

import React, { createContext, useContext, useState } from 'react';
import { ShieldAlert, X, Check, Lock } from 'lucide-react';
import { useTranslation } from './I18nContext';
import { useAuth } from './AuthContext';
import { getRoleDisplayName } from '../lib/rbac';

interface RestrictedModalOptions {
  title?: string;
  actionName?: string;
  message?: string;
}

interface PermissionModalContextType {
  openRestrictedModal: (options?: RestrictedModalOptions) => void;
  closeRestrictedModal: () => void;
}

const PermissionModalContext = createContext<PermissionModalContextType>({
  openRestrictedModal: () => {},
  closeRestrictedModal: () => {},
});

export const PermissionModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { locale } = useTranslation();
  const { user } = useAuth();
  const isKm = locale === 'km';

  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<RestrictedModalOptions>({});

  const openRestrictedModal = (options?: RestrictedModalOptions) => {
    setModalOptions(options || {});
    setIsOpen(true);
  };

  const closeRestrictedModal = () => {
    setIsOpen(false);
  };

  const userRoleDisplay = getRoleDisplayName(user?.role, isKm);
  const actionName = modalOptions.actionName || (isKm ? 'មុខងារនេះ' : 'this feature');

  return (
    <PermissionModalContext.Provider value={{ openRestrictedModal, closeRestrictedModal }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] shadow-2xl max-w-md w-full overflow-hidden p-6 relative animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeRestrictedModal}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
                <Lock className="w-7 h-7 text-amber-700" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  {modalOptions.title || (isKm ? 'សិទ្ធិត្រូវបានកំណត់ (Access Restricted)' : 'Access Permission Restricted')}
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  {isKm
                    ? 'ប្រព័ន្ធសុវត្ថិភាពទិន្នន័យវេជ្ជសាស្ត្រគ្លីនិក'
                    : 'Clinic Medical Data Confidentiality & Governance'}
                </p>
              </div>
            </div>

            {/* Human Message Body */}
            <div className="my-5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E1D4] text-xs text-stone-700 leading-relaxed space-y-2">
              <p>
                {modalOptions.message || (
                  isKm ? (
                    <>
                      គណនីបច្ចុប្បន្នរបស់អ្នកមានតួនាទីជា <span className="font-bold text-stone-900 underline">{userRoleDisplay}</span> ដែលមិនទាន់មានសិទ្ធិចូលប្រើប្រាស់ <span className="font-bold text-teal-900 font-mono">«{actionName}»</span> នេះឡើយ។
                    </>
                  ) : (
                    <>
                      Your active account has the role <span className="font-bold text-stone-900 underline">{userRoleDisplay}</span>, which is not permitted to access <span className="font-bold text-teal-900 font-mono">"{actionName}"</span>.
                    </>
                  )
                )}
              </p>
              <p className="text-[11px] text-stone-500 pt-1 border-t border-[#EBE3D3]">
                {isKm
                  ? 'ប្រសិនបើលោកអ្នកត្រូវការប្រើប្រាស់មុខងារនេះក្នុងការងារ សូមទាក់ទងម្ចាស់គ្លីនិក (Owner / Super Admin) ដើម្បីស្នើសុំសិទ្ធិបន្ថែម។'
                  : 'If you require access to perform clinical duties, please contact the Clinic Owner (Super Admin) to request permission.'}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={closeRestrictedModal}
                className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isKm ? 'ខ្ញុំបានយល់ (Understood)' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionModalContext.Provider>
  );
};

export function usePermissionModal() {
  return useContext(PermissionModalContext);
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { playHospitalChime, playPaymentSuccessChime } from '../../lib/chime';
import {
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  Pill,
  CreditCard,
  FileCheck,
  Settings,
  UserPlus,
  Globe,
  Volume2,
  ArrowRight,
  User,
  Clock,
  X,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { t, locale, toggleLocale } = useTranslation();
  const isKm = locale === 'km';

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, or Custom Event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced patient search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.patients.list({ search: query.trim(), limit: 4 });
        setPatientResults(res.data || []);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Standard Navigation Actions
  const navigationItems: CommandItem[] = [
    {
      id: 'nav-dashboard',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.dashboard,
      subtitle: isKm ? 'ផ្ទាំងបញ្ជា និងស្ថិតិសរុប' : 'Main clinical overview & KPIs',
      icon: LayoutDashboard,
      action: () => {
        router.push('/');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-patients',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.patients,
      subtitle: isKm ? 'បញ្ជីឈ្មោះ និងប្រវត្តិអ្នកជំងឺ' : 'Search & manage patient records',
      icon: Users,
      action: () => {
        router.push('/patients');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-queue',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.queue,
      subtitle: isKm ? 'ក្ដារជួរ និងប្រព័ន្ធហៅលេខ' : 'Live token display & calling screen',
      icon: Monitor,
      action: () => {
        router.push('/queue');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-visits',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.visits,
      subtitle: isKm ? 'ជួរពិនិត្យ វាស់ Vitals & ពិគ្រោះ' : 'Active encounters & vital triage',
      icon: Calendar,
      action: () => {
        router.push('/visits');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-prescriptions',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.prescriptions,
      subtitle: isKm ? 'ឱសថស្ថាន ចេញថ្នាំ & ស្តុក' : 'Pharmacy orders & dispensation',
      icon: Pill,
      action: () => {
        router.push('/prescriptions');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-billing',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.billing,
      subtitle: isKm ? 'វិក្កយបត្រ ទូទាត់ KHQR & សាច់ប្រាក់' : 'Invoices & KHQR payments',
      icon: CreditCard,
      action: () => {
        router.push('/billing');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-certificates',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.certificates,
      subtitle: isKm ? 'លិខិតឈប់សម្រាកព្យាបាល & កាយសម្បទា' : 'Printable medical certificates A4',
      icon: FileCheck,
      action: () => {
        router.push('/certificates');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-settings',
      category: isKm ? 'ការរុករក' : 'Navigation',
      title: t.nav.settings,
      subtitle: isKm ? 'ការកំណត់គ្លីនិក KHQR & តារាងថ្លៃ' : 'System configuration & fees',
      icon: Settings,
      action: () => {
        router.push('/settings');
        setIsOpen(false);
      },
    },
  ];

  // Quick Utility Actions
  const quickActions: CommandItem[] = [
    {
      id: 'act-toggle-lang',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'ប្តូរភាសាទៅ English' : 'Switch Language to ភាសាខ្មែរ',
      subtitle: isKm ? 'ប្តូរភាសាចំណុចប្រទាក់' : 'Toggle application language',
      icon: Globe,
      action: () => {
        toggleLocale();
        setIsOpen(false);
      },
      shortcut: 'L',
    },
    {
      id: 'act-test-payment-sound',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'សាកល្បងសំឡេងបង់ប្រាក់ KHQR' : 'Test KHQR Payment Chime',
      subtitle: isKm ? 'បន្លឺសំឡេងទូទាត់ជោគជ័យ' : 'Play procedural payment sound',
      icon: Volume2,
      action: () => {
        playPaymentSuccessChime();
      },
    },
    {
      id: 'act-test-queue-sound',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'សាកល្បងសំឡេងហៅជួរ Queue' : 'Test Hospital Queue Chime',
      subtitle: isKm ? 'បន្លឺសំឡេងប្រព័ន្ធផ្សព្វផ្សាយមន្ទីរពេទ្យ' : 'Play hospital PA chime',
      icon: Volume2,
      action: () => {
        playHospitalChime();
      },
    },
  ];

  // Filter items matching query
  const filteredNav = query.trim()
    ? navigationItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : navigationItems;

  const filteredQuick = query.trim()
    ? quickActions.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : quickActions;

  const allItems: CommandItem[] = [...filteredNav, ...filteredQuick];

  const handleSelect = (item: CommandItem) => {
    item.action();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <Search className="w-5 h-5 text-teal-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isKm
                ? 'ស្វែងរកមុខងារ អ្នកជំងឺ ឬពាក្យបញ្ជា (Ctrl+K)...'
                : 'Search commands, patients, or shortcuts (Ctrl+K)...'
            }
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Content List */}
        <div className="overflow-y-auto p-2 space-y-3 touch-scroll flex-1">
          {/* Patient Quick Match Results */}
          {patientResults.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800 font-mono">
                {isKm ? 'អ្នកជំងឺដែលត្រូវគ្នា' : 'Matched Patients'}
              </div>
              <div className="space-y-1 mt-1">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      router.push(`/patients/${p.id}`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                          {p.nameEn} {p.nameKh && <span className="font-normal text-slate-500">({p.nameKh})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.patientCode} • {p.phone}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isKm ? 'ទំព័រ និងការរុករក' : 'Navigation'}
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          {filteredQuick.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isKm ? 'សកម្មភាពរហ័ស & សំឡេង' : 'Quick Actions & Sounds'}
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredQuick.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-amber-50 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && patientResults.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isKm ? 'រកមិនឃើញមុខងារ ឬអ្នកជំងឺដែលត្រូវគ្នានឹង' : 'No commands or patients found for'}{' '}
              <strong className="text-slate-700">"{query}"</strong>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation Palette</span>
            <span>•</span>
            <span>Rotana Smart Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

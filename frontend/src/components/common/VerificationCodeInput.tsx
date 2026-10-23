'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mail, Clipboard, Check, Sparkles, AlertCircle } from 'lucide-react';

interface VerificationCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  isKm?: boolean;
}

export function VerificationCodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  isKm = true,
}: VerificationCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = value.replace(/\D/g, '').slice(0, 6).split('');
    while (arr.length < 6) arr.push('');
    return arr;
  });

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [clipboardCode, setClipboardCode] = useState<string | null>(null);
  const [showClipboardPill, setShowClipboardPill] = useState(false);
  const [isCopiedSuccess, setIsCopiedSuccess] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync internal digits with incoming value
  useEffect(() => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    const newDigits = clean.split('');
    while (newDigits.length < 6) newDigits.push('');
    setDigits(newDigits);
  }, [value]);

  // Focus management
  useEffect(() => {
    if (autoFocus && !disabled && inputRefs.current[0]) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const target = firstEmptyIndex === -1 ? 5 : firstEmptyIndex;
      inputRefs.current[target]?.focus();
      setActiveIndex(target);
    }
  }, []);

  // Web OTP API integration for mobile Android Chrome
  useEffect(() => {
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;

    const ac = new AbortController();
    navigator.credentials
      ?.get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      } as any)
      .then((otp: any) => {
        if (otp && otp.code) {
          const rawCode = otp.code.replace(/\D/g, '').slice(0, 6);
          if (rawCode.length === 6) {
            handleFullCodeEntered(rawCode);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully without user-facing errors
      });

    return () => {
      ac.abort();
    };
  }, []);

  // Smart Clipboard Scanner: Detect 6-digit OTP when returning from Gmail app
  const checkClipboardForCode = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.clipboard?.readText) return;

    try {
      const text = await navigator.clipboard.readText();
      const match = text.trim().match(/\b\d{6}\b/);
      if (match && match[0] && match[0] !== value) {
        setClipboardCode(match[0]);
        setShowClipboardPill(true);
      }
    } catch {
      // Browsers may block background clipboard reading if permission not granted
    }
  }, [value]);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkClipboardForCode();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [checkClipboardForCode]);

  const handleFullCodeEntered = (fullCode: string) => {
    const clean = fullCode.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    const newDigits = clean.split('');
    while (newDigits.length < 6) newDigits.push('');
    setDigits(newDigits);
    setActiveIndex(Math.min(clean.length, 5));

    if (clean.length === 6 && onComplete) {
      setTimeout(() => {
        onComplete(clean);
      }, 120);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');

    // Case 1: User pasted or OS auto-filled multiple digits via QuickType 1-click
    if (cleanDigits.length > 1) {
      handleFullCodeEntered(cleanDigits);
      return;
    }

    // Case 2: User typed single digit
    const char = cleanDigits.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    const merged = updated.join('');
    onChange(merged);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    if (updated.filter(Boolean).length === 6 && onComplete) {
      setTimeout(() => {
        onComplete(updated.join(''));
      }, 120);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
        onChange(updated.join(''));
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else {
        const updated = [...digits];
        updated[index] = '';
        setDigits(updated);
        onChange(updated.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain');
    const matched = pasteData.match(/\b\d{6}\b/) || pasteData.replace(/\D/g, '').slice(0, 6);
    const finalCode = typeof matched === 'string' ? matched : matched ? matched[0] : '';

    if (finalCode) {
      handleFullCodeEntered(finalCode);
      setIsCopiedSuccess(true);
      setTimeout(() => setIsCopiedSuccess(false), 2000);
    }
  };

  const handlePasteManualClick = async () => {
    setPasteFeedback(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
        setPasteFeedback(
          isKm
            ? 'សូមវាយបញ្ចូលលេខកូដដោយផ្ទាល់ ឬប្រើប្រាស់ Keyboard Autofill'
            : 'Please enter the code manually or use keyboard autofill'
        );
        setTimeout(() => setPasteFeedback(null), 4000);
        return;
      }

      const text = await navigator.clipboard.readText();
      const match = text.trim().match(/\b\d{6}\b/) || text.replace(/\D/g, '').slice(0, 6);
      const code = typeof match === 'string' ? match : match ? match[0] : '';

      if (code && code.length === 6) {
        handleFullCodeEntered(code);
        setShowClipboardPill(false);
        setIsCopiedSuccess(true);
        setTimeout(() => setIsCopiedSuccess(false), 2000);
      } else if (text.replace(/\D/g, '').length > 0) {
        const partial = text.replace(/\D/g, '').slice(0, 6);
        handleFullCodeEntered(partial);
      } else {
        setPasteFeedback(
          isKm
            ? 'មិនទាន់មានលេខកូដក្នុង Clipboard ទេ - សូមចូលទៅ Gmail ចម្លងលេខកូដ ៦ ខ្ទង់ជាមុនសិន'
            : 'No code in clipboard - please copy the 6-digit code from Gmail first'
        );
        setTimeout(() => setPasteFeedback(null), 4000);
      }
    } catch {
      setPasteFeedback(
        isKm
          ? 'សូមអនុញ្ញាតសិទ្ធិ Paste ក្នុង Browser ឬវាយលេខកូដ ៦ ខ្ទង់ដោយផ្ទាល់'
          : 'Please allow clipboard permissions or type the 6 digits directly'
      );
      setTimeout(() => setPasteFeedback(null), 4000);
    }
  };

  return (
    <div ref={containerRef} className="w-full space-y-3.5">
      {/* High-Visibility Quick-Paste & Auto-Detection Card */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/80 to-teal-50/90 border border-teal-200/90 rounded-2xl p-3 shadow-xs">
        {showClipboardPill && clipboardCode ? (
          <div className="flex items-center justify-between gap-3 animate-spring-pop">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-950 truncate">
                  {isKm ? 'រកឃើញលេខកូដបញ្ជាក់ពី Gmail' : 'Detected Code from Gmail'}
                </p>
                <p className="text-sm font-mono font-black text-emerald-800 tracking-wider">
                  {clipboardCode}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleFullCodeEntered(clipboardCode);
                setShowClipboardPill(false);
              }}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isKm ? 'ចុចបំពេញភ្លាមៗ' : '1-Click Fill'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-stone-700 text-xs min-w-0">
              <Mail className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium truncate">
                {isKm ? 'ចម្លងលេខកូដពី Gmail រួចចុចបិទភ្ជាប់' : 'Copy code from Gmail & tap Paste'}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePasteManualClick}
              className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-300 active:scale-95 text-teal-900 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {isCopiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{isKm ? 'បានបិទភ្ជាប់' : 'Pasted!'}</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isKm ? 'បិទភ្ជាប់លេខកូដ' : 'Paste Code'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Temporary Feedback on Paste Action */}
        {pasteFeedback && (
          <div className="mt-2 pt-2 border-t border-teal-100 flex items-start gap-1.5 text-[11px] text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{pasteFeedback}</span>
          </div>
        )}
      </div>

      {/* 6 Individual Digit PIN Boxes */}
      <div className="relative">
        {/* Hidden Master Input for iOS QuickType Bar and Android Gboard One-Tap Autofill */}
        <input
          type="text"
          name="one-time-code"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-0"
          value={value}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
            handleFullCodeEntered(clean);
          }}
        />

        <div className="flex items-center justify-center gap-2 sm:gap-3 z-10 relative">
          {digits.map((digit, index) => {
            const isCurrent = activeIndex === index;
            const isFilled = Boolean(digit);

            return (
              <div
                key={index}
                className="relative flex-1 max-w-[56px] sm:max-w-[64px]"
              >
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  disabled={disabled}
                  onFocus={() => setActiveIndex(index)}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-full h-14 sm:h-16 text-center text-2xl sm:text-3xl font-black font-mono rounded-2xl border-2 transition-all duration-150 outline-none select-none ${
                    isCurrent
                      ? 'border-teal-700 bg-teal-50/60 text-teal-950 shadow-md ring-4 ring-teal-700/20 scale-105'
                      : isFilled
                      ? 'border-teal-600/70 bg-white text-stone-900 shadow-xs'
                      : 'border-stone-300 bg-[#FAF7F2] text-stone-900 hover:border-stone-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />

                {/* Animated Blinking Cursor on Active Cell */}
                {isCurrent && !digit && !disabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-0.5 h-6 sm:h-7 bg-teal-700 animate-pulse rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auxiliary Note: QuickType & Gboard Info */}
      <div className="flex items-center justify-between text-xs pt-0.5 px-1">
        <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block animate-ping" />
          <span>{isKm ? 'ប្រព័ន្ធទទួលស្គាល់លេខកូដស្វ័យប្រវត្តិតាមទូរសព្ទ' : 'Smart auto-fill enabled'}</span>
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          {value.length}/6
        </span>
      </div>
    </div>
  );
}

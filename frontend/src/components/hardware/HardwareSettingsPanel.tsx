'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Printer,
  Usb,
  Wifi,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart2,
  Radio,
  X,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  PrinterConfig,
  PrinterConnectionType,
  PrinterDriver,
  createPrinterDriver,
} from '../../lib/hardware/printerDriver';
import { barcodeScanner } from '../../lib/hardware/scannerDriver';
import { printClinicInvoice, ClinicPrintData } from '../../lib/hardware/invoicePrinter';

const HARDWARE_STORAGE_KEY = 'rotana_hardware_config_v1';

interface HardwareConfig {
  connectionType: PrinterConnectionType;
  networkIp: string;
  networkPort: number;
  paperWidth: 48 | 32;
  scannerMode: 'keyboard-wedge' | 'hid';
  autoPrintOnPayment: boolean;
}

const DEFAULT_CONFIG: HardwareConfig = {
  connectionType: 'serial',
  networkIp: '192.168.1.100',
  networkPort: 9100,
  paperWidth: 48,
  scannerMode: 'keyboard-wedge',
  autoPrintOnPayment: false,
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type ScannerStatus = 'inactive' | 'active' | 'error';

export function HardwareSettingsPanel() {
  const [config, setConfig] = useState<HardwareConfig>(DEFAULT_CONFIG);
  const [printerStatus, setPrinterStatus] = useState<ConnectionStatus>('disconnected');
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('inactive');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{ code: string; ts: Date } | null>(null);
  const [testScanInput, setTestScanInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);
  const [drawerResult, setDrawerResult] = useState<string | null>(null);

  const driverRef = useRef<PrinterDriver | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HARDWARE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<HardwareConfig>;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  // Persist config whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HARDWARE_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }
  }, [config]);

  // Auto-print integration: listen to payment-confirmed custom event
  useEffect(() => {
    if (!config.autoPrintOnPayment) return;

    const handler = async (e: Event) => {
      const customEvent = e as CustomEvent<{ invoice: Record<string, unknown> }>;
      const invoice = customEvent.detail?.invoice;
      if (!invoice) return;
      if (!driverRef.current || !driverRef.current.isConnected()) return;

      const clinicSettingsRaw = localStorage.getItem('rotana_clinic_settings_v1');
      const clinicSettings = clinicSettingsRaw ? (JSON.parse(clinicSettingsRaw) as Record<string, unknown>) : {};

      const items = Array.isArray(invoice.lineItems)
        ? (invoice.lineItems as Array<{ description: string; amount: number }>)
        : [
            {
              description: String(invoice.reason || 'Medical Service'),
              amount: Number(invoice.payableAmount || 0),
            },
          ];

      const printData: ClinicPrintData = {
        clinicNameEn: String(clinicSettings.clinicNameEn || 'ROTANA MEDICAL CENTER'),
        clinicNameKh: String(clinicSettings.clinicNameKh || ''),
        clinicAddress: String(clinicSettings.addressEn || ''),
        clinicPhone: String(clinicSettings.phonePrimary || ''),
        mohLicense: String(clinicSettings.mohLicenseNumber || ''),
        invoiceNumber: String(invoice.invoiceNumber || ''),
        patientNameEn: String(
          (invoice.patient as Record<string, unknown> | undefined)?.nameEn || invoice.patientNameEn || 'Patient',
        ),
        patientNameKh: String(
          (invoice.patient as Record<string, unknown> | undefined)?.nameKh || '',
        ) || undefined,
        patientCode: String(
          (invoice.patient as Record<string, unknown> | undefined)?.patientCode || '',
        ) || undefined,
        visitDate: new Date(String(invoice.createdAt || Date.now())).toLocaleString(),
        lineItems: items,
        totalAmount: Number(invoice.payableAmount || 0),
        currency: String(invoice.currency || 'USD'),
        paymentMethod: String(invoice.paymentMethod || 'KHQR'),
        status: 'PAID',
        tranId: String((invoice as Record<string, unknown[]>).transactions?.[0] || '') || undefined,
        footerNote: String(clinicSettings.receiptFooterNoteEn || ''),
      };

      const printerConfig: PrinterConfig = {
        connectionType: config.connectionType,
        networkIp: config.networkIp,
        networkPort: config.networkPort,
        paperWidth: config.paperWidth,
      };

      try {
        await printClinicInvoice(driverRef.current, printData, printerConfig);
      } catch (err) {
        console.error('Auto-print failed:', err);
      }
    };

    window.addEventListener('payment-confirmed', handler);
    return () => window.removeEventListener('payment-confirmed', handler);
  }, [config]);

  // Connect printer
  const handleConnectPrinter = useCallback(async () => {
    setPrinterStatus('connecting');
    setPrinterError(null);

    // Disconnect existing driver
    if (driverRef.current) {
      try { await driverRef.current.disconnect(); } catch { /* ignore */ }
      driverRef.current = null;
    }

    const printerConfig: PrinterConfig = {
      connectionType: config.connectionType,
      networkIp: config.networkIp,
      networkPort: config.networkPort,
      paperWidth: config.paperWidth,
    };

    try {
      const driver = createPrinterDriver(printerConfig);
      await driver.connect();
      driverRef.current = driver;
      setPrinterStatus('connected');
    } catch (err: unknown) {
      const e = err as Error;
      setPrinterStatus('error');
      setPrinterError(e?.message ?? 'Connection failed');
    }
  }, [config]);

  // Test print
  const handleTestPrint = useCallback(async () => {
    if (!driverRef.current || !driverRef.current.isConnected()) {
      setTestResult('Printer not connected. Connect first.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const clinicSettingsRaw = localStorage.getItem('rotana_clinic_settings_v1');
      const clinicSettings = clinicSettingsRaw ? (JSON.parse(clinicSettingsRaw) as Record<string, unknown>) : {};
      await driverRef.current.testPrint(String(clinicSettings.clinicNameEn || 'ROTANA CLINIC'));
      setTestResult('Test page printed successfully.');
    } catch (err: unknown) {
      const e = err as Error;
      setTestResult(`Test print failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Open cash drawer
  const handleOpenDrawer = useCallback(async () => {
    if (!driverRef.current || !driverRef.current.isConnected()) {
      setDrawerResult('Printer not connected. Connect first.');
      return;
    }
    setIsOpeningDrawer(true);
    setDrawerResult(null);
    try {
      await driverRef.current.openDrawer();
      setDrawerResult('Cash drawer opened.');
    } catch (err: unknown) {
      const e = err as Error;
      setDrawerResult(`Failed to open drawer: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setIsOpeningDrawer(false);
    }
  }, []);

  // Disconnect printer
  const handleDisconnectPrinter = useCallback(async () => {
    if (driverRef.current) {
      try { await driverRef.current.disconnect(); } catch { /* ignore */ }
      driverRef.current = null;
    }
    setPrinterStatus('disconnected');
    setPrinterError(null);
  }, []);

  // Activate barcode scanner
  const handleActivateScanner = useCallback(async () => {
    setScannerError(null);
    try {
      if (config.scannerMode === 'keyboard-wedge') {
        barcodeScanner.startKeyboardWedge((code) => {
          setLastScanned({ code, ts: new Date() });
          setTestScanInput(code);
        });
        setScannerStatus('active');
      } else {
        await barcodeScanner.connectHid((code) => {
          setLastScanned({ code, ts: new Date() });
          setTestScanInput(code);
        });
        setScannerStatus('active');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setScannerStatus('error');
      setScannerError(e?.message ?? 'Failed to activate scanner');
    }
  }, [config.scannerMode]);

  const handleDeactivateScanner = useCallback(() => {
    barcodeScanner.disconnect();
    setScannerStatus('inactive');
    setScannerError(null);
  }, []);

  // Status badge helper
  const statusBadge = (status: ConnectionStatus) => {
    const map: Record<ConnectionStatus, { label: string; cls: string }> = {
      disconnected: { label: 'Disconnected', cls: 'bg-slate-100 text-slate-600' },
      connecting: { label: 'Connecting...', cls: 'bg-amber-50 text-amber-700' },
      connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      error: { label: 'Failed', cls: 'bg-red-50 text-red-700 border border-red-200' },
    };
    const { label, cls } = map[status];
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
        {status === 'connecting' && <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />}
        {status === 'connected' && <CheckCircle2 className="inline w-3 h-3 mr-1 text-emerald-600" />}
        {status === 'error' && <AlertCircle className="inline w-3 h-3 mr-1 text-red-500" />}
        {label}
      </span>
    );
  };

  const scannerBadge = (status: ScannerStatus) => {
    const map: Record<ScannerStatus, { label: string; cls: string }> = {
      inactive: { label: 'Inactive', cls: 'bg-slate-100 text-slate-600' },
      active: { label: 'Listening', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      error: { label: 'Error', cls: 'bg-red-50 text-red-700 border border-red-200' },
    };
    const { label, cls } = map[status];
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
        {status === 'active' && <Radio className="inline w-3 h-3 mr-1 text-emerald-600" />}
        {status === 'error' && <AlertCircle className="inline w-3 h-3 mr-1 text-red-500" />}
        {label}
      </span>
    );
  };

  const inputClass =
    'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white font-mono';
  const sectionHeadClass = 'text-sm font-bold text-slate-800 flex items-center gap-2 mb-4';

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* PRINTER SECTION */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className={sectionHeadClass}>
            <Printer className="w-4 h-4 text-teal-700" />
            Thermal Receipt Printer (ESC/POS)
          </h2>
          {statusBadge(printerStatus)}
        </div>

        {/* Connection Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Connection Method</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { val: 'serial', label: 'Web Serial (USB)', icon: <Cpu className="w-3.5 h-3.5" /> },
                { val: 'usb', label: 'WebUSB (Direct)', icon: <Usb className="w-3.5 h-3.5" /> },
                { val: 'network', label: 'Network TCP', icon: <Wifi className="w-3.5 h-3.5" /> },
              ] as const
            ).map(({ val, label, icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, connectionType: val }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  config.connectionType === val
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Network fields */}
        {config.connectionType === 'network' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Printer IP Address</label>
              <input
                type="text"
                value={config.networkIp}
                onChange={(e) => setConfig((c) => ({ ...c, networkIp: e.target.value }))}
                placeholder="192.168.1.100"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
              <input
                type="number"
                value={config.networkPort}
                onChange={(e) => setConfig((c) => ({ ...c, networkPort: parseInt(e.target.value) || 9100 }))}
                placeholder="9100"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Paper width */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Paper Width</label>
          <div className="flex gap-2">
            {(
              [
                { val: 48, label: '80mm Thermal (48 chars)' },
                { val: 32, label: '58mm Compact (32 chars)' },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, paperWidth: val }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  config.paperWidth === val
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {printerError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{printerError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {printerStatus !== 'connected' ? (
            <button
              type="button"
              onClick={handleConnectPrinter}
              disabled={printerStatus === 'connecting'}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-60 transition-colors"
            >
              {printerStatus === 'connecting' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              {printerStatus === 'connecting' ? 'Connecting...' : 'Connect Printer'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnectPrinter}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Disconnect
            </button>
          )}

          <button
            type="button"
            onClick={handleTestPrint}
            disabled={isTesting || printerStatus !== 'connected'}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-60 transition-colors"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Test Print
          </button>

          <button
            type="button"
            onClick={handleOpenDrawer}
            disabled={isOpeningDrawer || printerStatus !== 'connected'}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-60 transition-colors"
          >
            {isOpeningDrawer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
            Open Cash Drawer
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.includes('success') || testResult.includes('opened')
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {testResult.includes('success') || testResult.includes('opened') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            {testResult}
          </div>
        )}

        {drawerResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              drawerResult.includes('opened')
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {drawerResult.includes('opened') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            {drawerResult}
          </div>
        )}

        {/* Auto-print toggle */}
        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoPrintOnPayment}
              onChange={(e) => setConfig((c) => ({ ...c, autoPrintOnPayment: e.target.checked }))}
              className="mt-0.5 w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
            />
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Auto-print receipt when payment confirmed
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Automatically prints thermal receipt after KHQR or cash payment is settled. Printer must be connected.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* ================================================================ */}
      {/* BARCODE SCANNER SECTION */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className={sectionHeadClass}>
            <BarChart2 className="w-4 h-4 text-teal-700" />
            Barcode / QR Code Scanner
          </h2>
          {scannerBadge(scannerStatus)}
        </div>

        {/* Scanner mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Scanner Mode</label>
          <div className="flex gap-2">
            {(
              [
                { val: 'keyboard-wedge', label: 'Keyboard Wedge (USB HID)' },
                { val: 'hid', label: 'WebHID Direct API' },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  if (scannerStatus === 'active') handleDeactivateScanner();
                  setConfig((c) => ({ ...c, scannerMode: val }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  config.scannerMode === val
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {config.scannerMode === 'keyboard-wedge'
              ? 'Most USB scanners work in keyboard emulation mode. No driver needed - plug in and activate.'
              : 'WebHID requires Chrome 89+ on desktop. Click Activate and select the scanner device.'}
          </p>
        </div>

        {scannerError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{scannerError}</span>
          </div>
        )}

        {/* Activate/Deactivate */}
        <div className="flex gap-2">
          {scannerStatus !== 'active' ? (
            <button
              type="button"
              onClick={handleActivateScanner}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              Activate Scanner
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeactivateScanner}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Deactivate Scanner
            </button>
          )}
        </div>

        {/* Live test field */}
        {scannerStatus === 'active' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scan a barcode to test...
              </label>
              <input
                type="text"
                value={testScanInput}
                onChange={(e) => setTestScanInput(e.target.value)}
                placeholder="Waiting for scan input..."
                readOnly={config.scannerMode === 'hid'}
                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {lastScanned && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800 font-mono">{lastScanned.code}</div>
                    <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {lastScanned.ts.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

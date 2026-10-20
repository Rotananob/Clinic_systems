'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  HardwarePOSConfig,
  getHardwarePOSConfig,
  saveHardwarePOSConfig,
  requestSerialPort,
  kickCashDrawer,
  printReceiptSilently,
  ReceiptData,
  PaperWidth,
  DrawerPin,
  PrinterInterface,
} from '../../lib/hardware-pos';
import { useBarcodeScanner } from '../../lib/useBarcodeScanner';

interface HardwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSettingsModal: React.FC<HardwareSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useTranslation();
  const hpT = t.hardwarePOS;

  const [config, setConfig] = useState<HardwarePOSConfig>(getHardwarePOSConfig());
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getHardwarePOSConfig());
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  // Hook up barcode scanner listener inside modal for live diagnostic testing
  useBarcodeScanner({
    onScan: (scanned) => {
      setLastScannedCode(scanned);
      setScanTimestamp(new Date().toLocaleTimeString());
      setFeedbackMessage(`Barcode captured: ${scanned}`);
    },
    minChars: 3,
  });

  if (!isOpen) return null;

  const handleSave = () => {
    saveHardwarePOSConfig(config);
    setFeedbackMessage(locale === 'km' ? 'បានរក្សាទុកការកំណត់ផ្នែករឹងជោគជ័យ។' : 'Hardware settings saved successfully.');
  };

  const handleConnectPort = async () => {
    setIsBusy(true);
    setFeedbackMessage(null);
    const result = await requestSerialPort(config.baudRate);
    setIsBusy(false);
    if (result.success) {
      setConnectionStatus('connected');
    }
    setFeedbackMessage(result.message);
  };

  const handleTestDrawer = async () => {
    setIsBusy(true);
    setFeedbackMessage(null);
    const result = await kickCashDrawer(config.drawerPin);
    setIsBusy(false);
    setFeedbackMessage(result.message || hpT.testSuccessPulse);
  };

  const handleTestPrint = async () => {
    setIsBusy(true);
    setFeedbackMessage(null);
    const sampleReceipt: ReceiptData = {
      clinicName: locale === 'km' ? 'គ្លីនិកព្យាបាល និងពិគ្រោះជំងឺ' : 'ClinicOS Medical Center',
      clinicAddress: 'St 271, Phnom Penh, Cambodia',
      clinicPhone: '+855 12 345 678',
      invoiceNumber: `TEST-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString(),
      patientName: locale === 'km' ? 'អ្នកជំងឺសាកល្បង' : 'Diagnostic Test Patient',
      patientId: 'PAT-0099',
      items: [
        {
          name: locale === 'km' ? 'ការពិគ្រោះជំងឺទូទៅ' : 'General Medical Consultation',
          quantity: 1,
          unitPrice: 10.0,
          total: 10.0,
        },
        {
          name: 'Amoxicillin 500mg (20 Tab)',
          quantity: 1,
          unitPrice: 4.5,
          total: 4.5,
        },
      ],
      subtotal: 14.5,
      tax: 0.0,
      totalUsd: 14.5,
      totalKhr: 59450,
      paymentMethod: 'CASH',
      cashierName: 'POS System Admin',
    };

    const result = await printReceiptSilently(sampleReceipt, config.paperWidth);
    setIsBusy(false);
    setFeedbackMessage(result.message || hpT.testSuccessPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {hpT.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {hpT.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <span className="text-xl font-bold leading-none">&times;</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Alert Banner */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium">
              {feedbackMessage}
            </div>
          )}

          {/* Section 1: Silent Printing & Thermal Paper */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {hpT.silentPrint}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hpT.silentPrintDesc}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.silentPrintEnabled}
                  onChange={(e) => setConfig({ ...config, silentPrintEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {hpT.paperWidth}
                </label>
                <select
                  value={config.paperWidth}
                  onChange={(e) => setConfig({ ...config, paperWidth: e.target.value as PaperWidth })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="80mm">{hpT.paper80mm}</option>
                  <option value="58mm">{hpT.paper58mm}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {hpT.printerInterface}
                </label>
                <select
                  value={config.printerInterface}
                  onChange={(e) => setConfig({ ...config, printerInterface: e.target.value as PrinterInterface })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="serial">{hpT.interfaceSerial}</option>
                  <option value="network">{hpT.interfaceNetwork}</option>
                </select>
              </div>
            </div>

            {config.printerInterface === 'serial' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="w-full sm:w-auto flex items-center space-x-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {hpT.baudRate}:
                  </span>
                  <select
                    value={config.baudRate}
                    onChange={(e) => setConfig({ ...config, baudRate: Number(e.target.value) })}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  >
                    <option value="9600">9600 bps</option>
                    <option value="19200">19200 bps</option>
                    <option value="38400">38400 bps</option>
                    <option value="115200">115200 bps</option>
                  </select>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {connectionStatus === 'connected' ? hpT.statusConnected : hpT.statusDisconnected}
                  </span>
                </div>
                <div className="w-full sm:w-auto flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleConnectPort}
                    disabled={isBusy}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition shadow-sm"
                  >
                    {hpT.connectPrinter}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isBusy}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                  >
                    {hpT.testPrintReceipt}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Network Gateway Endpoint
                </label>
                <input
                  type="text"
                  value={config.networkPrinterAddress}
                  onChange={(e) => setConfig({ ...config, networkPrinterAddress: e.target.value })}
                  placeholder="http://192.168.1.100:9100/print"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 2: Auto Cash Drawer Kick */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {hpT.autoCashDrawer}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hpT.autoCashDrawerDesc}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoKickDrawer}
                  onChange={(e) => setConfig({ ...config, autoKickDrawer: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full sm:w-auto flex items-center space-x-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {hpT.drawerPin}:
                </span>
                <select
                  value={config.drawerPin}
                  onChange={(e) => setConfig({ ...config, drawerPin: e.target.value as DrawerPin })}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="pin2">{hpT.drawerPin2}</option>
                  <option value="pin5">{hpT.drawerPin5}</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleTestDrawer}
                disabled={isBusy}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
              >
                {hpT.testCashDrawer}
              </button>
            </div>
          </div>

          {/* Section 3: USB / Bluetooth Barcode Scanner Diagnostic */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900 dark:text-white">
                {hpT.barcodeScannerTitle}
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active Listener
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hpT.barcodeScannerDesc}
            </p>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400 block">{hpT.lastScannedBarcode}:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {lastScannedCode || hpT.noBarcodeYet}
                </span>
              </div>
              {scanTimestamp && (
                <span className="text-[10px] font-mono text-slate-400">
                  {scanTimestamp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            {hpT.saveSettings}
          </button>
        </div>
      </div>
    </div>
  );
};

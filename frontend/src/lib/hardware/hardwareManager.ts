'use client';

/**
 * HardwareManager - Global background service for hardware peripherals:
 * 1. Thermal Receipt Printers (Web Serial, WebUSB, Web Bluetooth, Network TCP)
 * 2. Barcode & QR Scanners (Keyboard wedge & WebHID)
 * 3. Electronic Cash Drawer Kick Pulses
 * 4. Global Auto-Print on Payment settlement across all clinic views
 */

import {
  PrinterConfig,
  PrinterDriver,
  createPrinterDriver,
  PrinterConnectionType,
} from './printerDriver';
import { printClinicInvoice, ClinicPrintData } from './invoicePrinter';
import { barcodeScanner } from './scannerDriver';

export const HARDWARE_STORAGE_KEY = 'rotana_hardware_config_v1';

export interface HardwareConfig {
  connectionType: PrinterConnectionType;
  networkIp: string;
  networkPort: number;
  paperWidth: 48 | 32;
  scannerMode: 'keyboard-wedge' | 'hid';
  autoPrintOnPayment: boolean;
  drawerPin: 2 | 5;
}

export const DEFAULT_HARDWARE_CONFIG: HardwareConfig = {
  connectionType: 'network',
  networkIp: '192.168.1.100',
  networkPort: 9100,
  paperWidth: 48,
  scannerMode: 'keyboard-wedge',
  autoPrintOnPayment: false,
  drawerPin: 2,
};

class HardwareManagerService {
  private activeDriver: PrinterDriver | null = null;
  private isInitialized = false;

  public getConfig(): HardwareConfig {
    if (typeof window === 'undefined') return DEFAULT_HARDWARE_CONFIG;
    try {
      const raw = localStorage.getItem(HARDWARE_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_HARDWARE_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_HARDWARE_CONFIG;
  }

  public saveConfig(cfg: Partial<HardwareConfig>): void {
    if (typeof window === 'undefined') return;
    const current = this.getConfig();
    const updated = { ...current, ...cfg };
    try {
      localStorage.setItem(HARDWARE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  /**
   * Initialize global listeners on application startup (called once in AppShell)
   */
  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // 1. Global Auto-Print and Cash Drawer Kick Listener for settled invoices
    window.addEventListener('payment-confirmed', async (e: Event) => {
      const cfg = this.getConfig();
      const customEvent = e as CustomEvent<{ invoice: Record<string, unknown> }>;
      const invoice = customEvent.detail?.invoice;
      if (!invoice) return;

      // Automatically trigger cash drawer kick for cash settlements
      const method = String(invoice.paymentMethod || '').toUpperCase();
      if (cfg.drawerPin && (method === 'CASH' || method === '')) {
        try {
          await this.openCashDrawer();
        } catch (err) {
          console.warn('[HardwareManager] Cash drawer kick skipped or failed:', err);
        }
      }

      if (cfg.autoPrintOnPayment) {
        try {
          await this.printInvoice(invoice);
        } catch (err) {
          console.warn('[HardwareManager] Auto-print skipped or failed:', err);
        }
      }
    });

    // 2. Global Barcode Scanner Listener in Keyboard Wedge mode
    const cfg = this.getConfig();
    if (cfg.scannerMode === 'keyboard-wedge') {
      barcodeScanner.startKeyboardWedge((scannedCode) => {
        window.dispatchEvent(
          new CustomEvent('barcode-scanned', {
            detail: { code: scannedCode, timestamp: Date.now() },
          }),
        );
      });
    }
  }

  /**
   * Acquire or create a connected PrinterDriver instance
   */
  public async getDriver(forceReconnect = false): Promise<PrinterDriver> {
    const cfg = this.getConfig();
    const printerConfig: PrinterConfig = {
      connectionType: cfg.connectionType,
      networkIp: cfg.networkIp,
      networkPort: cfg.networkPort,
      paperWidth: cfg.paperWidth,
    };

    if (!forceReconnect && this.activeDriver && this.activeDriver.isConnected()) {
      return this.activeDriver;
    }

    if (this.activeDriver) {
      try {
        await this.activeDriver.disconnect();
      } catch {
        // ignore
      }
      this.activeDriver = null;
    }

    const driver = createPrinterDriver(printerConfig);
    await driver.connect();
    this.activeDriver = driver;
    return driver;
  }

  /**
   * Print an official clinic receipt on the configured thermal POS printer
   */
  public async printInvoice(invoice: Record<string, unknown>): Promise<void> {
    const cfg = this.getConfig();
    const driver = await this.getDriver();

    let clinicSettings: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem('rotana_clinic_settings_v1');
      if (raw) clinicSettings = JSON.parse(raw);
    } catch {
      // fallback
    }

    const rawLineItems = invoice.lineItems;
    const items = Array.isArray(rawLineItems)
      ? (rawLineItems as Array<{ description: string; amount: number }>)
      : [
          {
            description: String(invoice.reason || 'Medical Consultation & Care'),
            amount: Number(invoice.payableAmount || invoice.totalAmount || 0),
          },
        ];

    const patientObj = invoice.patient as Record<string, unknown> | undefined;

    const printData: ClinicPrintData = {
      clinicNameEn: String(clinicSettings.clinicNameEn || 'ROTANA CLINIC & MATERNITY'),
      clinicNameKh: String(clinicSettings.clinicNameKh || 'មន្ទីរសម្រាកព្យាបាល និងសម្ភព រតនា'),
      clinicAddress: String(
        clinicSettings.addressEn || 'Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh',
      ),
      clinicPhone: String(clinicSettings.phonePrimary || '023 999 888 / 012 345 678'),
      mohLicense: String(clinicSettings.mohLicenseNumber || 'MoH-Lic: 2024/089-CP'),
      invoiceNumber: String(invoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`),
      patientNameEn: String(patientObj?.nameEn || invoice.patientNameEn || 'Clinic Patient'),
      patientNameKh: patientObj?.nameKh ? String(patientObj.nameKh) : undefined,
      patientCode: patientObj?.patientCode ? String(patientObj.patientCode) : undefined,
      visitDate: new Date(String(invoice.paidAt || invoice.createdAt || Date.now())).toLocaleString(),
      lineItems: items,
      totalAmount: Number(invoice.payableAmount || invoice.totalAmount || 0),
      currency: String(invoice.currency || 'USD'),
      paymentMethod: String(invoice.paymentMethod || 'KHQR'),
      status: String(invoice.status || 'PAID'),
      tranId:
        String(
          (invoice.transactions as Array<Record<string, unknown>> | undefined)?.[0]?.tranId ||
            (invoice.transactions as unknown[])?.[0] ||
            '',
        ) || undefined,
      footerNote: String(
        clinicSettings.receiptFooterNoteEn || 'Thank you for choosing Rotana Clinic. Wish you a speedy recovery!',
      ),
    };

    const printerConfig: PrinterConfig = {
      connectionType: cfg.connectionType,
      networkIp: cfg.networkIp,
      networkPort: cfg.networkPort,
      paperWidth: cfg.paperWidth,
    };

    await printClinicInvoice(driver, printData, printerConfig);
  }

  /**
   * Kick open connected cash drawer
   */
  public async openCashDrawer(): Promise<void> {
    const cfg = this.getConfig();
    const driver = await this.getDriver();
    await driver.openDrawer(cfg.drawerPin || 2);
  }
}

export const hardwareManager = new HardwareManagerService();

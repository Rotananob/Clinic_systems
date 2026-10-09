'use client';

/**
 * BarcodeScanner - Handles both keyboard-wedge and WebHID barcode scanners.
 */
export interface ScannerConfig {
  mode: 'keyboard-wedge' | 'hid';
  onScan: (code: string) => void;
}

export class BarcodeScanner {
  private wedgeBuffer = '';
  private lastKeyTime = 0;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;
  private hidDevice: HIDDevice | null = null;
  private hidBuffer = '';

  /**
   * Keyboard-wedge mode: listen to document keydown events.
   * Scanners typically send characters in rapid succession (<50ms apart)
   * followed by Enter. Min 4 chars considered a real scan.
   */
  startKeyboardWedge(onScan: (code: string) => void): void {
    this.stopKeyboardWedge();

    this.keyListener = (e: KeyboardEvent) => {
      const now = Date.now();
      const delta = now - this.lastKeyTime;
      this.lastKeyTime = now;

      if (e.key === 'Enter') {
        const code = this.wedgeBuffer.trim();
        this.wedgeBuffer = '';
        if (code.length >= 4) {
          onScan(code);
        }
        return;
      }

      // If gap is too large, this is regular keyboard - reset buffer
      if (delta > 200 && this.wedgeBuffer.length > 0) {
        this.wedgeBuffer = '';
      }

      // Only collect printable single characters
      if (e.key.length === 1) {
        this.wedgeBuffer += e.key;
      }

      // Auto-emit after 300ms silence if buffer >= 4 chars
      // (some scanners don't send Enter)
      clearTimeout((this as unknown as Record<string, unknown>)._wedgeTimer as ReturnType<typeof setTimeout>);
      if (this.wedgeBuffer.length >= 4) {
        (this as unknown as Record<string, unknown>)._wedgeTimer = setTimeout(() => {
          const code = this.wedgeBuffer.trim();
          this.wedgeBuffer = '';
          if (code.length >= 4) {
            onScan(code);
          }
        }, 300);
      }
    };

    document.addEventListener('keydown', this.keyListener);
  }

  stopKeyboardWedge(): void {
    if (this.keyListener) {
      document.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
    this.wedgeBuffer = '';
    clearTimeout((this as unknown as Record<string, unknown>)._wedgeTimer as ReturnType<typeof setTimeout>);
  }

  /**
   * USB HID mode: request a HID barcode scanner device via WebHID API.
   */
  async connectHid(onScan: (code: string) => void): Promise<void> {
    if (!('hid' in navigator)) {
      throw new Error('WebHID API is not supported in this browser. Use Chrome 89+ on desktop.');
    }

    const devices = await (navigator as unknown as { hid: HID }).hid.requestDevice({ filters: [] });
    if (!devices || devices.length === 0) {
      throw new Error('No HID device selected.');
    }

    const device = devices[0];
    this.hidDevice = device;

    if (!device.opened) {
      await device.open();
    }

    device.addEventListener('inputreport', (event: HIDInputReportEvent) => {
      const data = event.data;
      // Most HID barcode scanners use Boot Keyboard protocol (usage 0x06, page 0x01)
      // Key code is at byte 2 onward; simple ASCII extraction from modifier + key bytes
      // This handles basic ASCII scanners; complex HID descriptors would need parsing
      const modifier = data.getUint8(0);
      const keyCode = data.getUint8(2);

      if (keyCode === 0) return; // key up

      let char = '';
      if (keyCode >= 0x04 && keyCode <= 0x1d) {
        // a-z
        char = String.fromCharCode(keyCode - 0x04 + (modifier ? 65 : 97));
      } else if (keyCode >= 0x1e && keyCode <= 0x27) {
        // 1-0
        const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        char = digits[keyCode - 0x1e] ?? '';
      } else if (keyCode === 0x28) {
        // Enter
        const code = this.hidBuffer.trim();
        this.hidBuffer = '';
        if (code.length >= 4) {
          onScan(code);
        }
        return;
      }

      if (char) {
        this.hidBuffer += char;
      }
    });
  }

  disconnect(): void {
    this.stopKeyboardWedge();
    if (this.hidDevice) {
      this.hidDevice.close().catch(() => {
        // Ignore close errors
      });
      this.hidDevice = null;
    }
    this.hidBuffer = '';
  }
}

export const barcodeScanner = new BarcodeScanner();

// WebHID type declarations (not in standard lib.dom.d.ts on all TS versions)
interface HIDDevice {
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  addEventListener(type: 'inputreport', listener: (e: HIDInputReportEvent) => void): void;
}

interface HIDInputReportEvent {
  data: DataView;
  device: HIDDevice;
  reportId: number;
}

interface HID {
  requestDevice(options: { filters: unknown[] }): Promise<HIDDevice[]>;
}

/**
 * PrinterDriver - Abstraction layer for thermal receipt printer connections.
 * Supports Web Serial API, WebUSB API, and Network TCP via backend proxy.
 */
import { EscPosEncoder } from './escpos';

export type PrinterConnectionType = 'serial' | 'usb' | 'network';

export interface PrinterConfig {
  connectionType: PrinterConnectionType;
  networkIp?: string;
  networkPort?: number;
  usbVendorId?: number;
  usbProductId?: number;
  /** Characters per line: 48 for 80mm, 32 for 58mm paper */
  paperWidth: 48 | 32;
}

export interface PrinterDriver {
  connect(): Promise<void>;
  isConnected(): boolean;
  print(data: Uint8Array): Promise<void>;
  openDrawer(): Promise<void>;
  disconnect(): Promise<void>;
  testPrint(clinicName?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Web Serial API driver
// ---------------------------------------------------------------------------

// Declare SerialPort types for browsers that support Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly writable: WritableStream<Uint8Array>;
}

interface Serial {
  requestPort(options?: { filters?: { usbVendorId?: number }[] }): Promise<SerialPort>;
}

// Module-level port cache so we don't re-request permission on every print
let _serialPort: SerialPort | null = null;

export class SerialPrinterDriver implements PrinterDriver {
  private connected = false;

  async connect(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Use Chrome 89+ on desktop.');
    }
    const serial = (navigator as unknown as { serial: Serial }).serial;
    try {
      _serialPort = await serial.requestPort({ filters: [] });
      await _serialPort.open({ baudRate: 9600 });
      this.connected = true;
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e?.name === 'NotFoundError') {
        throw new Error('No serial port selected. Please select your printer port.');
      }
      throw new Error(`Serial connection failed: ${e?.message ?? String(err)}`);
    }
  }

  isConnected(): boolean {
    return this.connected && _serialPort !== null;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!_serialPort) throw new Error('Printer not connected. Call connect() first.');
    const writer = _serialPort.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  async openDrawer(): Promise<void> {
    const pulse = new EscPosEncoder().openCashDrawer().encode();
    await this.print(pulse);
  }

  async disconnect(): Promise<void> {
    if (_serialPort) {
      try { await _serialPort.close(); } catch { /* ignore */ }
      _serialPort = null;
    }
    this.connected = false;
  }

  async testPrint(clinicName = 'ROTANA CLINIC'): Promise<void> {
    const data = new EscPosEncoder()
      .initialize()
      .align('center')
      .bold(true)
      .text(clinicName)
      .newline()
      .bold(false)
      .align('left')
      .line('-', 32)
      .text('PRINTER TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .text('Serial connection: OK')
      .newline(3)
      .cut()
      .encode();
    await this.print(data);
  }
}

// ---------------------------------------------------------------------------
// WebUSB API driver
// ---------------------------------------------------------------------------

interface USBDevice {
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  configuration: {
    interfaces: Array<{
      interfaceNumber: number;
      alternate: {
        endpoints: Array<{
          direction: string;
          endpointNumber: number;
        }>;
      };
    }>;
  } | null;
  transferOut(endpointNumber: number, data: BufferSource | Uint8Array): Promise<{ status: string }>;
}

interface USB {
  requestDevice(options: { filters: { vendorId?: number; productId?: number }[] }): Promise<USBDevice>;
}

let _usbDevice: USBDevice | null = null;
let _usbEndpoint = 1;

export class UsbPrinterDriver implements PrinterDriver {
  private connected = false;

  async connect(): Promise<void> {
    if (!('usb' in navigator)) {
      throw new Error('WebUSB API is not supported in this browser. Use Chrome 89+ on desktop.');
    }
    const usb = (navigator as unknown as { usb: USB }).usb;
    try {
      _usbDevice = await usb.requestDevice({ filters: [] });
      await _usbDevice.open();
      await _usbDevice.selectConfiguration(1);

      // Find OUT endpoint from first interface
      const iface = _usbDevice.configuration?.interfaces[0];
      if (iface) {
        await _usbDevice.claimInterface(iface.interfaceNumber);
        const outEndpoint = iface.alternate.endpoints.find((ep) => ep.direction === 'out');
        if (outEndpoint) {
          _usbEndpoint = outEndpoint.endpointNumber;
        }
      }

      this.connected = true;
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e?.name === 'NotFoundError') {
        throw new Error('No USB device selected. Please select your ESC/POS printer.');
      }
      throw new Error(`USB connection failed: ${e?.message ?? String(err)}`);
    }
  }

  isConnected(): boolean {
    return this.connected && _usbDevice !== null;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!_usbDevice) throw new Error('USB printer not connected. Call connect() first.');
    const result = await _usbDevice.transferOut(_usbEndpoint, data);
    if (result.status !== 'ok') {
      throw new Error(`USB transfer failed with status: ${result.status}`);
    }
  }

  async openDrawer(): Promise<void> {
    const pulse = new EscPosEncoder().openCashDrawer().encode();
    await this.print(pulse);
  }

  async disconnect(): Promise<void> {
    if (_usbDevice) {
      try {
        if (_usbDevice.configuration) {
          const iface = _usbDevice.configuration.interfaces[0];
          if (iface) await _usbDevice.releaseInterface(iface.interfaceNumber);
        }
        await _usbDevice.close();
      } catch { /* ignore */ }
      _usbDevice = null;
    }
    this.connected = false;
  }

  async testPrint(clinicName = 'ROTANA CLINIC'): Promise<void> {
    const data = new EscPosEncoder()
      .initialize()
      .align('center')
      .bold(true)
      .text(clinicName)
      .newline()
      .bold(false)
      .align('left')
      .line('-', 32)
      .text('PRINTER TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .text('USB connection: OK')
      .newline(3)
      .cut()
      .encode();
    await this.print(data);
  }
}

// ---------------------------------------------------------------------------
// Network TCP driver (via NestJS backend proxy)
// ---------------------------------------------------------------------------

const NETWORK_TIMEOUT_MS = 5000;

export class NetworkPrinterDriver implements PrinterDriver {
  private config: PrinterConfig;
  private _connected = false;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (!this.config.networkIp || !this.config.networkPort) {
      throw new Error('Network printer requires IP address and port.');
    }
    // Test connectivity via backend
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    try {
      const res = await fetch('http://localhost:4000/api/hardware/test-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: this.config.networkIp, port: this.config.networkPort }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Printer unreachable: ${text}`);
      }
      this._connected = true;
    } catch (err: unknown) {
      const e = err as Error;
      if (e?.name === 'AbortError') {
        throw new Error(`Connection timeout after ${NETWORK_TIMEOUT_MS / 1000}s. Check IP and port.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  isConnected(): boolean {
    return this._connected;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.config.networkIp || !this.config.networkPort) {
      throw new Error('Network printer IP/port not configured.');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    try {
      const res = await fetch('http://localhost:4000/api/hardware/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.config.networkIp,
          port: this.config.networkPort,
          data: Array.from(data),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Print failed: ${text}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e?.name === 'AbortError') {
        throw new Error(`Print timeout after ${NETWORK_TIMEOUT_MS / 1000}s.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async openDrawer(): Promise<void> {
    if (!this.config.networkIp || !this.config.networkPort) {
      throw new Error('Network printer IP/port not configured.');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    try {
      const res = await fetch('http://localhost:4000/api/hardware/open-drawer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: this.config.networkIp, port: this.config.networkPort }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Open drawer failed: ${text}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e?.name === 'AbortError') {
        throw new Error(`Drawer pulse timeout after ${NETWORK_TIMEOUT_MS / 1000}s.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  async testPrint(clinicName = 'ROTANA CLINIC'): Promise<void> {
    const data = new EscPosEncoder()
      .initialize()
      .align('center')
      .bold(true)
      .text(clinicName)
      .newline()
      .bold(false)
      .align('left')
      .line('-', 32)
      .text('PRINTER TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .text(`Network ${this.config.networkIp}:${this.config.networkPort} OK`)
      .newline(3)
      .cut()
      .encode();
    await this.print(data);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPrinterDriver(config: PrinterConfig): PrinterDriver {
  switch (config.connectionType) {
    case 'serial':
      return new SerialPrinterDriver();
    case 'usb':
      return new UsbPrinterDriver();
    case 'network':
      return new NetworkPrinterDriver(config);
    default:
      throw new Error(`Unknown printer connection type: ${config.connectionType}`);
  }
}

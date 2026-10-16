import { EscPosEncoder } from './escpos';
import { getApiBaseUrl } from '../api';

export type PrinterConnectionType = 'serial' | 'usb' | 'bluetooth' | 'network';

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
  openDrawer(pin?: 2 | 5): Promise<void>;
  disconnect(): Promise<void>;
  testPrint(clinicName?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Web Serial API driver
// ---------------------------------------------------------------------------

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly writable: WritableStream<Uint8Array>;
}

interface Serial {
  requestPort(options?: { filters?: { usbVendorId?: number }[] }): Promise<SerialPort>;
}

let _serialPort: SerialPort | null = null;

export class SerialPrinterDriver implements PrinterDriver {
  private connected = false;

  async connect(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
    }
    const serial = (navigator as unknown as { serial: Serial }).serial;
    try {
      _serialPort = await serial.requestPort({ filters: [] });
      await _serialPort.open({ baudRate: 9600 });
      this.connected = true;
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e?.name === 'NotFoundError') {
        throw new Error('No serial port selected. Please select your printer COM port.');
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

  async openDrawer(pin: 2 | 5 = 2): Promise<void> {
    const pulse = new EscPosEncoder().openCashDrawer(pin).encode();
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
      .size('double')
      .text(clinicName)
      .newline()
      .bold(false)
      .size('normal')
      .line('-', 32)
      .text('HARDWARE TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .align('left')
      .text('Port: Serial COM (9600 baud)')
      .newline()
      .text('Status: Hardware Verified')
      .newline()
      .align('center')
      .qrCode('https://rotanaclinic.com/verify-hardware', 5)
      .newline()
      .text('Scan to Verify POS Link')
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
      throw new Error('WebUSB API is not supported in this browser. Please use Chrome or Edge.');
    }
    const usb = (navigator as unknown as { usb: USB }).usb;
    try {
      _usbDevice = await usb.requestDevice({ filters: [] });
      await _usbDevice.open();
      await _usbDevice.selectConfiguration(1);

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
        throw new Error('No USB device selected. Please select your ESC/POS thermal printer.');
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

  async openDrawer(pin: 2 | 5 = 2): Promise<void> {
    const pulse = new EscPosEncoder().openCashDrawer(pin).encode();
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
      .size('double')
      .text(clinicName)
      .newline()
      .bold(false)
      .size('normal')
      .line('-', 32)
      .text('HARDWARE TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .align('left')
      .text('Port: WebUSB POS Direct')
      .newline()
      .text('Status: Hardware Verified')
      .newline()
      .align('center')
      .qrCode('https://rotanaclinic.com/verify-hardware', 5)
      .newline()
      .text('Scan to Verify POS Link')
      .newline(3)
      .cut()
      .encode();
    await this.print(data);
  }
}

// ---------------------------------------------------------------------------
// Web Bluetooth API driver (Portable Bluetooth 58mm/80mm POS Printers)
// ---------------------------------------------------------------------------

interface BluetoothDevice {
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
  };
}

interface BluetoothRemoteGATTServer {
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

const COMMON_BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Receipt Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard BLE Serial Port
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
];

export class BluetoothPrinterDriver implements PrinterDriver {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error(
        'Web Bluetooth API is not supported in this browser. Please use Chrome or Edge on Windows, Mac, or Android.',
      );
    }
    const bt = (navigator as unknown as { bluetooth: { requestDevice(opts: unknown): Promise<BluetoothDevice> } }).bluetooth;
    try {
      this.device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: COMMON_BLE_PRINTER_SERVICES,
      });

      if (!this.device || !this.device.gatt) {
        throw new Error('Bluetooth printer selection cancelled or GATT server unavailable.');
      }

      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            break;
          }
        }
        if (this.characteristic) break;
      }

      if (!this.characteristic) {
        throw new Error('Could not find a writable ESC/POS channel on this Bluetooth device.');
      }

      this.connected = true;
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e?.name === 'NotFoundError') {
        throw new Error('No Bluetooth printer selected.');
      }
      throw new Error(`Bluetooth connection failed: ${e?.message ?? String(err)}`);
    }
  }

  isConnected(): boolean {
    return this.connected && this.device?.gatt?.connected === true && this.characteristic !== null;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Bluetooth printer not connected. Call connect() first.');
    }

    // Packet chunking: write in 100-byte slices with 15ms delays to prevent BLE FIFO buffer overrun
    const CHUNK_SIZE = 100;
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  async openDrawer(pin: 2 | 5 = 2): Promise<void> {
    const pulse = new EscPosEncoder().openCashDrawer(pin).encode();
    await this.print(pulse);
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // ignore
      }
      this.device = null;
    }
    this.characteristic = null;
    this.connected = false;
  }

  async testPrint(clinicName = 'ROTANA CLINIC'): Promise<void> {
    const data = new EscPosEncoder()
      .initialize()
      .align('center')
      .bold(true)
      .size('double')
      .text(clinicName)
      .newline()
      .bold(false)
      .size('normal')
      .line('-', 32)
      .text('HARDWARE TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .align('left')
      .text(`Device: ${this.device?.name || 'Bluetooth POS Printer'}`)
      .newline()
      .text('Status: Hardware Verified')
      .newline()
      .align('center')
      .qrCode('https://rotanaclinic.com/verify-hardware', 5)
      .newline()
      .text('Scan to Verify POS Link')
      .newline(3)
      .cut()
      .encode();
    await this.print(data);
  }
}

// ---------------------------------------------------------------------------
// Network TCP driver (via NestJS backend proxy with JWT & dynamic base URL)
// ---------------------------------------------------------------------------

const NETWORK_TIMEOUT_MS = 6000;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('clinic_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

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
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/hardware/test-printer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ip: this.config.networkIp, port: Number(this.config.networkPort) }),
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
        throw new Error(`Connection timeout after ${NETWORK_TIMEOUT_MS / 1000}s. Check printer IP:Port.`);
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
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/hardware/print`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ip: this.config.networkIp,
          port: Number(this.config.networkPort),
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

  async openDrawer(pin: 2 | 5 = 2): Promise<void> {
    if (!this.config.networkIp || !this.config.networkPort) {
      throw new Error('Network printer IP/port not configured.');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/hardware/open-drawer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ip: this.config.networkIp,
          port: Number(this.config.networkPort),
          pin,
        }),
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
      .size('double')
      .text(clinicName)
      .newline()
      .bold(false)
      .size('normal')
      .line('-', 32)
      .text('HARDWARE TEST PAGE')
      .newline()
      .text(new Date().toLocaleString())
      .newline()
      .line('-', 32)
      .align('left')
      .text(`Host: ${this.config.networkIp}:${this.config.networkPort}`)
      .newline()
      .text('Status: TCP Link Verified')
      .newline()
      .align('center')
      .qrCode('https://rotanaclinic.com/verify-hardware', 5)
      .newline()
      .text('Scan to Verify POS Link')
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
    case 'bluetooth':
      return new BluetoothPrinterDriver();
    case 'network':
      return new NetworkPrinterDriver(config);
    default:
      throw new Error(`Unknown printer connection type: ${config.connectionType}`);
  }
}

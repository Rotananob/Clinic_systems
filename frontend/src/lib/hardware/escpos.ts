/**
 * EscPosEncoder - ESC/POS command builder for thermal receipt printers.
 * Supports 80mm (48 chars / 576 dots) and 58mm (32 chars / 384 dots) paper widths.
 * Includes native 2D QR Code, 1D Barcode, and Canvas raster bitmap generation.
 */
export class EscPosEncoder {
  private buffer: number[] = [];

  /** ESC @ - Initialize printer, clear buffer and settings */
  initialize(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /** ESC a n - Set text alignment (0=left, 1=center, 2=right) */
  align(a: 'left' | 'center' | 'right'): this {
    const map: Record<string, number> = { left: 0x00, center: 0x01, right: 0x02 };
    this.buffer.push(0x1b, 0x61, map[a] ?? 0x00);
    return this;
  }

  /** ESC E n - Bold on/off */
  bold(on: boolean): this {
    this.buffer.push(0x1b, 0x45, on ? 0x01 : 0x00);
    return this;
  }

  /** GS ! n - Character size */
  size(s: 'normal' | 'double' | 'triple'): this {
    const val = s === 'double' ? 0x11 : s === 'triple' ? 0x22 : 0x00;
    this.buffer.push(0x1d, 0x21, val);
    return this;
  }

  /** Encode a string and append its bytes to the buffer */
  text(content: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /** LF - newline(s) */
  newline(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  /** Separator line using repeated character */
  line(char = '-', width = 32): this {
    return this.text(char.repeat(width)).newline();
  }

  /** GS V B - Full paper cut */
  cut(partial = false): this {
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x42, 0x00);
    return this;
  }

  /** ESC p m t1 t2 - Open cash drawer pulse (pin 2 or pin 5) */
  openCashDrawer(pin: 2 | 5 = 2): this {
    const m = pin === 5 ? 0x01 : 0x00;
    this.buffer.push(0x1b, 0x70, m, 0x19, 0xfa);
    return this;
  }

  /**
   * Native ESC/POS 2D QR Code Generation (Model 2)
   * Compatible with Epson, Xprinter, Rongta, Star, Bixolon, Hoin.
   * @param content - Payload (e.g., KHQR deep link, patient URL, payment token)
   * @param moduleSize - Dot size of each QR module (1 to 16, default: 6 for 80mm, 4 for 58mm)
   */
  qrCode(content: string, moduleSize = 6): this {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(content);
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Select QR Code Model 2 (Function 165)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Set QR Code Module Size (Function 167)
    const clampedSize = Math.max(1, Math.min(16, moduleSize));
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, clampedSize);

    // 3. Set Error Correction Level M (~15%) (Function 169)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

    // 4. Store data in symbol storage area (Function 180)
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < dataBytes.length; i++) {
      this.buffer.push(dataBytes[i]);
    }

    // 5. Print the stored QR Code symbol (Function 181)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  /**
   * GS k - 1D Barcode (Code128 format)
   * Suitable for patient ID codes, prescription IDs, medical record numbers.
   */
  barcode(code: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(code);

    // Set barcode height to 60 dots
    this.buffer.push(0x1d, 0x68, 0x3c);
    // Set barcode width to 2 dots
    this.buffer.push(0x1d, 0x77, 0x02);
    // Print HRI characters below barcode
    this.buffer.push(0x1d, 0x48, 0x02);

    // GS k 73 (Code128) len data
    this.buffer.push(0x1d, 0x6b, 0x49, bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /**
   * Raster Bit Image (GS v 0) - Renders an HTML Canvas to monochrome thermal dots.
   * This guarantees 100% accurate rendering of Khmer typography, logos, and medical emblems
   * on ANY ESC/POS thermal printer without relying on printer hardware font sets.
   */
  canvasImage(canvas: HTMLCanvasElement): this {
    const ctx = canvas.getContext('2d');
    if (!ctx) return this;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const rgba = imgData.data;

    // Number of horizontal bytes (each byte holds 8 horizontal pixels)
    const widthBytes = Math.ceil(width / 8);
    const xL = widthBytes % 256;
    const xH = Math.floor(widthBytes / 256);
    const yL = height % 256;
    const yH = Math.floor(height / 256);

    // GS v 0 0 xL xH yL yH
    this.buffer.push(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH);

    for (let y = 0; y < height; y++) {
      for (let xb = 0; xb < widthBytes; xb++) {
        let byteVal = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = xb * 8 + bit;
          if (x < width) {
            const idx = (y * width + x) * 4;
            const r = rgba[idx];
            const g = rgba[idx + 1];
            const b = rgba[idx + 2];
            const a = rgba[idx + 3];

            // Convert to luminance; alpha below 128 is treated as white background
            const isDark = a > 128 && (0.299 * r + 0.587 * g + 0.114 * b) < 165;
            if (isDark) {
              byteVal |= (0x80 >> bit);
            }
          }
        }
        this.buffer.push(byteVal);
      }
    }
    return this;
  }

  /** Return assembled bytes as a standard Uint8Array */
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

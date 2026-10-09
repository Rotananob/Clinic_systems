/**
 * EscPosEncoder - ESC/POS command builder for thermal receipt printers.
 * Supports 80mm (48 chars) and 58mm (32 chars) paper widths.
 */
export class EscPosEncoder {
  private buffer: number[] = [];

  /** ESC @ - Initialize printer, clear buffer and settings */
  initialize(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /** ESC a n - Set text alignment */
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
  size(s: 'normal' | 'double'): this {
    this.buffer.push(0x1d, 0x21, s === 'double' ? 0x11 : 0x00);
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

  /** GS V B - Full cut */
  cut(): this {
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  /** ESC p 0 25 250 - Open cash drawer pulse (pin 2) */
  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  /** Return assembled bytes */
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

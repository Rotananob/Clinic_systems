/**
 * invoicePrinter - High-level clinic invoice printing via ESC/POS.
 */
import { EscPosEncoder } from './escpos';
import { PrinterDriver, PrinterConfig } from './printerDriver';

export interface ClinicPrintData {
  clinicNameEn: string;
  clinicNameKh: string;
  clinicAddress: string;
  clinicPhone: string;
  mohLicense: string;
  invoiceNumber: string;
  patientNameEn: string;
  patientNameKh?: string;
  patientCode?: string;
  visitDate: string;
  doctorName?: string;
  lineItems: Array<{ description: string; amount: number }>;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  tranId?: string;
  footerNote?: string;
}

/**
 * Format a number as a right-aligned price string within a fixed total width.
 * E.g. formatLine('General Consultation', 10.00, 48)
 *   => 'General Consultation             $10.00'
 */
function formatLine(label: string, amount: number, width: number): string {
  const priceStr = `$${amount.toFixed(2)}`;
  const maxLabel = width - priceStr.length - 1;
  const truncated = label.length > maxLabel ? label.slice(0, maxLabel - 1) + '.' : label;
  const padded = truncated.padEnd(maxLabel, ' ');
  return `${padded} ${priceStr}`;
}

/**
 * Wrap a long string to fit within a given column width.
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= width) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word.slice(0, width);
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function renderKhmerHeaderToCanvas(khmerText: string, widthPixels = 384): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = widthPixels;
    canvas.height = 46;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px "Kantumruy Pro", "Battambang", "Khmer OS", sans-serif';
    ctx.fillText(khmerText, canvas.width / 2, canvas.height / 2);
    return canvas;
  } catch {
    return null;
  }
}

export async function printClinicInvoice(
  driver: PrinterDriver,
  data: ClinicPrintData,
  config: PrinterConfig,
): Promise<void> {
  const w = config.paperWidth; // 48 chars (80mm) or 32 chars (58mm)
  const dotWidth = w <= 32 ? 384 : 576;
  const enc = new EscPosEncoder();

  // Init
  enc.initialize();

  // ---- CLINIC HEADER ----
  enc.align('center').bold(true).size(w <= 32 ? 'normal' : 'double');
  enc.text(data.clinicNameEn).newline();
  enc.size('normal').bold(false);

  // Khmer Name via Canvas Rasterizer (guarantees crisp Khmer font rendering without printer firmware limitations)
  if (data.clinicNameKh) {
    const khmerCanvas = renderKhmerHeaderToCanvas(data.clinicNameKh, dotWidth);
    if (khmerCanvas) {
      enc.canvasImage(khmerCanvas);
    }
  }

  // Address wrapped to width
  const addressLines = wrapText(data.clinicAddress, w);
  for (const al of addressLines) {
    enc.text(al).newline();
  }

  enc.text(`Tel: ${data.clinicPhone}`).newline();
  if (data.mohLicense) {
    enc.text(`MoH License: ${data.mohLicense}`).newline();
  }

  // ---- SEPARATOR ----
  enc.align('left').line('=', w);

  // ---- INVOICE INFO ----
  enc.bold(true).text('OFFICIAL MEDICAL RECEIPT').newline().bold(false);
  enc.text(`Invoice #: ${data.invoiceNumber}`).newline();
  enc.text(`Date: ${data.visitDate}`).newline();

  // ---- PATIENT INFO ----
  enc.line('-', w);
  enc.text(`Patient: ${data.patientNameEn}`).newline();
  if (data.patientNameKh) {
    enc.text(`Khmer: ${data.patientNameKh}`).newline();
  }
  if (data.patientCode) {
    enc.text(`Patient ID: ${data.patientCode}`).newline();
  }
  if (data.doctorName) {
    enc.text(`Doctor: ${data.doctorName}`).newline();
  }

  // ---- LINE ITEMS ----
  enc.line('-', w);
  enc.bold(true).text('Services & Items').newline().bold(false);
  enc.line('-', w);

  for (const item of data.lineItems) {
    const line = formatLine(item.description, item.amount, w);
    enc.text(line).newline();
  }

  // ---- TOTALS ----
  enc.line('=', w);
  const totalLine = formatLine('TOTAL', data.totalAmount, w);
  enc.bold(true).text(totalLine).newline().bold(false);

  const khrAmount = Math.round(data.totalAmount * 4100);
  enc
    .align('right')
    .text(`(${khrAmount.toLocaleString()} KHR)`)
    .newline()
    .align('left');

  // ---- PAYMENT & TRAN ID ----
  enc.line('-', w);
  enc.text(`Payment Method: ${data.paymentMethod}`).newline();
  enc.text(`Payment Status: ${data.status}`).newline();
  if (data.tranId) {
    enc.text(`TranID: ${data.tranId}`).newline();
  }

  // ---- NATIVE 2D QR CODE FOR DIGITAL VERIFICATION ----
  const qrPayload = data.tranId || data.invoiceNumber || `REC-${Date.now()}`;
  enc.newline().align('center');
  enc.qrCode(qrPayload, w <= 32 ? 4 : 5);
  enc.text('Scan for Verification / KHQR').newline();

  // ---- FOOTER ----
  enc.line('=', w);
  enc.align('center');
  const footer = data.footerNote || 'Thank you for choosing our clinic!';
  const footerLines = wrapText(footer, w);
  for (const fl of footerLines) {
    enc.text(fl).newline();
  }
  enc.newline(2);

  // ---- CUT ----
  enc.cut();

  await driver.print(enc.encode());
}

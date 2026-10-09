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

export async function printClinicInvoice(
  driver: PrinterDriver,
  data: ClinicPrintData,
  config: PrinterConfig,
): Promise<void> {
  const w = config.paperWidth; // 48 or 32
  const enc = new EscPosEncoder();

  // Init
  enc.initialize();

  // ---- CLINIC HEADER ----
  enc.align('center').bold(true).size('double');
  // Clinic name may be long; use normal size if 58mm
  if (w <= 32) {
    enc.size('normal');
  }
  enc.text(data.clinicNameEn).newline();
  enc.size('normal').bold(false);

  // Khmer name if available (ASCII-safe only; Khmer is Unicode so may not render)
  if (data.clinicNameKh) {
    enc.text(data.clinicNameKh).newline();
  }

  // Address wrapped to width
  const addressLines = wrapText(data.clinicAddress, w);
  for (const al of addressLines) {
    enc.text(al).newline();
  }

  enc.text(`Tel: ${data.clinicPhone}`).newline();
  enc.text(`License: ${data.mohLicense}`).newline();

  // ---- SEPARATOR ----
  enc.align('left').line('=', w);

  // ---- INVOICE INFO ----
  enc.bold(true).text('OFFICIAL INVOICE / RECEIPT').newline().bold(false);
  enc.text(`Invoice #: ${data.invoiceNumber}`).newline();
  enc.text(`Date: ${data.visitDate}`).newline();

  // ---- PATIENT INFO ----
  enc.line('-', w);
  enc.text(`Patient: ${data.patientNameEn}`).newline();
  if (data.patientNameKh) {
    enc.text(`  ${data.patientNameKh}`).newline();
  }
  if (data.patientCode) {
    enc.text(`Code: ${data.patientCode}`).newline();
  }
  if (data.doctorName) {
    enc.text(`Doctor: ${data.doctorName}`).newline();
  }

  // ---- LINE ITEMS ----
  enc.line('-', w);
  enc.bold(true).text('Services / Items').newline().bold(false);
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

  // ---- PAYMENT ----
  enc.line('-', w);
  enc.text(`Payment: ${data.paymentMethod}`).newline();
  enc.text(`Status: ${data.status}`).newline();
  if (data.tranId) {
    enc.text(`Tran ID: ${data.tranId}`).newline();
  }

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

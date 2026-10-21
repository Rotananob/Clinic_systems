/**
 * EMVCo CRC-16 (CCITT 0xFFFF) Checksum calculation for Cambodian KHQR
 */
export function computeCrc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Builds valid Bakong EMVCo Tag 01=12 Dynamic KHQR string
 */
export function buildDynamicKhqr(params: {
  bakongId: string;
  merchantName: string;
  merchantCity?: string;
  amount: number;
  currency?: 'USD' | 'KHR';
  billNumber?: string;
}): string {
  const bakongId = params.bakongId.trim();
  const merchantName = (params.merchantName.trim() || 'ROTANA CLINIC').slice(0, 25);
  const merchantCity = (params.merchantCity?.trim() || 'PHNOM PENH').slice(0, 15);
  const amount = Number(params.amount) || 0;
  const currency = params.currency || 'USD';
  const billNumber = (params.billNumber?.trim() || `BILL-${Date.now().toString().slice(-6)}`).slice(0, 25);

  // Tag 29: Merchant Account Information
  const tag29_00 = `00${String(bakongId.length).padStart(2, '0')}${bakongId}`;
  const tag29 = `29${String(tag29_00.length).padStart(2, '0')}${tag29_00}`;

  // Tag 53: Currency (840 for USD, 116 for KHR)
  const currencyCode = currency === 'KHR' ? '116' : '840';
  const tag53 = `5303${currencyCode}`;

  // Tag 54: Transaction Amount
  const amountStr = amount.toFixed(2);
  const tag54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

  // Tag 58: Country Code (KH)
  const tag58 = '5802KH';

  // Tag 59: Merchant Name
  const tag59 = `59${String(merchantName.length).padStart(2, '0')}${merchantName}`;

  // Tag 60: Merchant City
  const tag60 = `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`;

  // Tag 62: Additional Data Field (Bill Number)
  const tag62_01 = `01${String(billNumber.length).padStart(2, '0')}${billNumber}`;
  const tag62 = `62${String(tag62_01.length).padStart(2, '0')}${tag62_01}`;

  // Tag 01=12 signifies Dynamic KHQR
  const rawPayload = `000201010212${tag29}52045999${tag53}${tag54}${tag58}${tag59}${tag60}${tag62}6304`;
  const crc = computeCrc16(rawPayload);

  return `${rawPayload}${crc}`;
}

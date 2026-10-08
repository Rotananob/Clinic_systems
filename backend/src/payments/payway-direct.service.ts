import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface DirectPaywaySession {
  abaData: string;
  requestTime: string;
  checkoutUrl: string;
  cookieHeader: string;
  cachedAt: number;
}

export interface DirectInvoiceResult {
  tranId: string;
  qrString: string;
  clientId: string;
  token?: string;
  requestTime: string;
  cookieHeader: string;
  checkoutUrl: string;
}

export interface DirectStatusResult {
  status: 'PAID' | 'PENDING' | 'FAILED';
  tranId: string;
  raw?: any;
}

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': BROWSER_USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

const API_HEADERS_BASE: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://link.payway.com.kh',
  'User-Agent': BROWSER_USER_AGENT,
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'language': 'en',
};

const ABA_DATA_REGEX = /["']?aba_data["']?\s*[:=,]\s*["']([^"']+)["']/;
const REQUEST_TIME_REGEX = /["']?request_time["']?\s*[:=,]\s*["']?(\d+)["']?/;

const ENDPOINTS = {
  listPaymentOptions: 'https://pwapp.ababank.com/api/pw-app/v1/payment/gateway/list-payment-options',
  checkPaymentStatus: 'https://pwapp.ababank.com/api/pw-app/v1/payment-link/check-payment-status',
};

@Injectable()
export class PaywayDirectService {
  private readonly logger = new Logger(PaywayDirectService.name);
  private sessionPool = new Map<string, DirectPaywaySession>();
  private readonly sessionTtlMs = 180000; // 3 minutes cache

  /**
   * Harvests Cloudflare Bot Clearance Cookie (__cf_bm) and handshake tokens from link.payway.com.kh.
   */
  async fetchSession(checkoutUrl: string, forceFresh = false): Promise<DirectPaywaySession> {
    if (!forceFresh) {
      const existing = this.sessionPool.get(checkoutUrl);
      if (existing && Date.now() - existing.cachedAt < this.sessionTtlMs) {
        return existing;
      }
    }

    this.logger.log(`Performing handshake with ${checkoutUrl} to harvest Cloudflare session clearance`);

    const res = await fetch(checkoutUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`Failed to handshake with checkout link: HTTP ${res.status}`);
    }

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const cfBmCookie = setCookies.find((c) => c.startsWith('__cf_bm='))?.split(';')[0] || '';
    const i18nCookie = setCookies.find((c) => c.startsWith('i18n_redirected='))?.split(';')[0] || 'i18n_redirected=en';
    const cookieHeader = [cfBmCookie, i18nCookie].filter(Boolean).join('; ');

    const html = await res.text();
    const abaMatch = html.match(ABA_DATA_REGEX);
    const reqMatch = html.match(REQUEST_TIME_REGEX);

    if (!abaMatch || !abaMatch[1]) {
      throw new Error('Unable to extract aba_data from PayWay checkout link');
    }
    if (!reqMatch || !reqMatch[1]) {
      throw new Error('Unable to extract request_time from PayWay checkout link');
    }

    const rawAbaData = abaMatch[1].replace(/\\u002F/g, '/');
    const session: DirectPaywaySession = {
      abaData: rawAbaData,
      requestTime: reqMatch[1],
      checkoutUrl,
      cookieHeader,
      cachedAt: Date.now(),
    };

    this.sessionPool.set(checkoutUrl, session);
    this.logger.log(`Handshake clearance captured for ${checkoutUrl}. Has __cf_bm: ${Boolean(cfBmCookie)}`);
    return session;
  }

  /**
   * Requests a live registered dynamic KHQR invoice from pwapp.ababank.com
   * spoofing Cloudflare Bot Clearance cookie and exact browser handshake headers.
   */
  async createInvoice(options: {
    amount: number;
    currency?: 'USD' | 'KHR';
    checkoutUrl: string;
  }): Promise<DirectInvoiceResult> {
    const { amount, currency = 'USD', checkoutUrl } = options;
    const formattedAmount = currency === 'KHR' ? Math.round(amount).toString() : amount.toFixed(2);

    let session = await this.fetchSession(checkoutUrl);

    const executeRequest = async (currentSession: DirectPaywaySession) => {
      const additionalFields = JSON.stringify({ amount: formattedAmount });
      const clientHash = crypto
        .createHash('sha512')
        .update(`${currentSession.requestTime}${currentSession.abaData}${additionalFields}`, 'utf8')
        .digest('hex');

      const payload = {
        aba_data: currentSession.abaData,
        additional_fields: additionalFields,
        hash: clientHash,
        request_time: currentSession.requestTime,
      };

      const res = await fetch(ENDPOINTS.listPaymentOptions, {
        method: 'POST',
        headers: {
          ...API_HEADERS_BASE,
          'Referer': checkoutUrl,
          'Cookie': currentSession.cookieHeader,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        throw new Error(`PayWay list-payment-options failed with HTTP ${res.status}`);
      }

      return res.json() as Promise<any>;
    };

    let data: any;
    try {
      data = await executeRequest(session);
    } catch (err: any) {
      this.logger.warn(`Initial invoice request failed (${err.message}). Retrying with fresh handshake session`);
      this.sessionPool.delete(checkoutUrl);
      session = await this.fetchSession(checkoutUrl, true);
      data = await executeRequest(session);
    }

    const qrString = data?.data?.qr_string || data?.qr_string;
    if (!qrString) {
      // Retry once if payload rejected
      this.logger.warn(`Empty qr_string in response. Forcing fresh session`);
      this.sessionPool.delete(checkoutUrl);
      session = await this.fetchSession(checkoutUrl, true);
      data = await executeRequest(session);
    }

    const finalQrString = data?.data?.qr_string || data?.qr_string;
    if (!finalQrString) {
      throw new Error(`PayWay invoice response rejected: ${JSON.stringify(data?.status || data)}`);
    }

    const tranId = String(data?.status?.tran_id || data?.tran_id || data?.data?.tran_id || '');
    const clientId = String(data?.client_id || '');
    const token = data?.token;

    this.logger.log(`Live registered KHQR invoice created successfully. TranID: ${tranId}, ClientID: ${clientId}`);

    return {
      tranId,
      qrString: finalQrString,
      clientId,
      token,
      requestTime: session.requestTime,
      cookieHeader: session.cookieHeader,
      checkoutUrl,
    };
  }

  /**
   * Polls pwapp.ababank.com/api/pw-app/v1/payment-link/check-payment-status
   * using harvested __cf_bm cookie, token, and matching SHA-512 handshake hash.
   */
  async checkPaymentStatus(params: {
    tranId: string;
    clientId: string;
    token?: string;
    requestTime: string;
    cookieHeader?: string;
    checkoutUrl: string;
  }): Promise<DirectStatusResult> {
    const { tranId, clientId, token, requestTime, checkoutUrl } = params;

    let cookieHeader = params.cookieHeader;
    if (!cookieHeader) {
      const cached = this.sessionPool.get(checkoutUrl);
      cookieHeader = cached?.cookieHeader;
    }

    // If still no cookie, fetch fresh clearance cookie
    if (!cookieHeader) {
      try {
        const freshSession = await this.fetchSession(checkoutUrl);
        cookieHeader = freshSession.cookieHeader;
      } catch (err: any) {
        this.logger.warn(`Failed to refresh cookie for status check: ${err.message}`);
      }
    }

    const deviceId = 'KlaSor' + Math.floor(1000 + Math.random() * 9000);
    const statusHash = crypto
      .createHash('sha512')
      .update(`${clientId}${deviceId}${requestTime}`, 'utf8')
      .digest('hex');

    const statusPayload = {
      client_id: clientId,
      device_id: deviceId,
      hash: statusHash,
      request_time: requestTime,
    };

    const headers: Record<string, string> = {
      ...API_HEADERS_BASE,
      'Referer': checkoutUrl,
      'Cookie': cookieHeader || '',
      ...(token ? { token } : {}),
    };

    try {
      const res = await fetch(ENDPOINTS.checkPaymentStatus, {
        method: 'POST',
        headers,
        body: JSON.stringify(statusPayload),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        // If HTTP 403 occurs due to stale Cloudflare cookie, force fresh session
        if (res.status === 403) {
          this.logger.warn(`Status check received HTTP 403. Refreshing Cloudflare session cookie`);
          this.sessionPool.delete(checkoutUrl);
          const refreshedSession = await this.fetchSession(checkoutUrl, true);
          headers.Cookie = refreshedSession.cookieHeader;

          const retryRes = await fetch(ENDPOINTS.checkPaymentStatus, {
            method: 'POST',
            headers,
            body: JSON.stringify(statusPayload),
            signal: AbortSignal.timeout(8000),
          });

          if (retryRes.ok) {
            const retryData = (await retryRes.json()) as any;
            return this.evaluateStatusResponse(retryData, tranId);
          }
        }
        return { status: 'PENDING', tranId };
      }

      const data = (await res.json()) as any;
      return this.evaluateStatusResponse(data, tranId);
    } catch (err: any) {
      this.logger.warn(`Status check query network warning for ${tranId}: ${err.message}`);
      return { status: 'PENDING', tranId };
    }
  }

  private evaluateStatusResponse(data: any, tranId: string): DirectStatusResult {
    const action = data?.data?.action?.toLowerCase();
    const code = data?.code || data?.status?.code;
    const statusText = data?.data?.status || data?.status;

    const isApproved =
      action === 'approved' ||
      action === 'paid' ||
      action === 'completed' ||
      statusText === 'APPROVED' ||
      statusText === 0 ||
      code === '00' && action === 'approved';

    if (isApproved) {
      return { status: 'PAID', tranId, raw: data };
    }

    if (action === 'expired' || statusText === 'EXPIRED') {
      return { status: 'FAILED', tranId, raw: data };
    }

    return { status: 'PENDING', tranId, raw: data };
  }
}

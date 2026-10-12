import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { TrackingEventDto } from './dto/tracking-event.dto';
import { Request } from 'express';

interface CachedGeo {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
  cachedAt: number;
}

@Injectable()
export class TrackingService implements OnModuleInit {
  private readonly logger = new Logger(TrackingService.name);
  private readonly geoCache = new Map<string, CachedGeo>();
  private readonly alertThrottle = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    await this.ensureTableExists();
  }

  /**
   * Automatically ensure table exists across all PostgreSQL instances
   */
  private async ensureTableExists() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "visitor_logs" (
          "id" BIGSERIAL PRIMARY KEY,
          "sessionId" TEXT,
          "ipAddress" TEXT NOT NULL,
          "country" TEXT,
          "countryCode" TEXT,
          "city" TEXT,
          "region" TEXT,
          "isp" TEXT,
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "deviceType" TEXT,
          "os" TEXT,
          "browser" TEXT,
          "screenResolution" TEXT,
          "language" TEXT,
          "path" TEXT NOT NULL,
          "title" TEXT,
          "referrer" TEXT,
          "action" TEXT NOT NULL DEFAULT 'PAGE_VIEW',
          "userId" UUID,
          "userEmail" TEXT,
          "userRole" TEXT,
          "userName" TEXT,
          "details" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "visitor_logs_ipAddress_idx" ON "visitor_logs"("ipAddress");
        CREATE INDEX IF NOT EXISTS "visitor_logs_path_idx" ON "visitor_logs"("path");
        CREATE INDEX IF NOT EXISTS "visitor_logs_action_idx" ON "visitor_logs"("action");
        CREATE INDEX IF NOT EXISTS "visitor_logs_createdAt_idx" ON "visitor_logs"("createdAt");
      `);
      this.logger.log('Visitor logs database table verified and indexed.');
    } catch (err: any) {
      this.logger.warn(`Visitor logs table setup notice: ${err.message}`);
    }
  }

  /**
   * Accurately extracts real client IP address from proxy/CDN headers
   */
  extractRealIp(req: Request, clientFallback?: string): string {
    const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
    if (cfConnectingIp && !this.isPrivateIp(cfConnectingIp.trim())) {
      return cfConnectingIp.trim();
    }

    const trueClientIp = req.headers['true-client-ip'] as string;
    if (trueClientIp && !this.isPrivateIp(trueClientIp.trim())) {
      return trueClientIp.trim();
    }

    const xRealIp = req.headers['x-real-ip'] as string;
    if (xRealIp && !this.isPrivateIp(xRealIp.trim())) {
      return xRealIp.trim();
    }

    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const parts = xForwardedFor.split(',').map((p) => p.trim());
      for (const ip of parts) {
        if (ip && !this.isPrivateIp(ip)) {
          return ip;
        }
      }
    }

    const socketIp = req.ip || req.socket?.remoteAddress || '';
    const cleanSocketIp = socketIp.replace(/^::ffff:/, '').trim();

    if (!this.isPrivateIp(cleanSocketIp) && cleanSocketIp.length > 0) {
      return cleanSocketIp;
    }

    if (clientFallback && !this.isPrivateIp(clientFallback.trim())) {
      return clientFallback.trim();
    }

    return cleanSocketIp || '127.0.0.1';
  }

  private isPrivateIp(ip: string): boolean {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
    return false;
  }

  /**
   * Geolocation resolution from CDN headers or GeoIP service with 2h cache
   */
  async resolveGeoLocation(req: Request, ip: string): Promise<CachedGeo> {
    // 1. Check Vercel & Cloudflare Edge Geo headers first
    const vercelCountry = req.headers['x-vercel-ip-country'] as string;
    const vercelCity = req.headers['x-vercel-ip-city'] as string;
    const vercelRegion = req.headers['x-vercel-ip-country-region'] as string;
    const vercelLat = req.headers['x-vercel-ip-latitude'] as string;
    const vercelLon = req.headers['x-vercel-ip-longitude'] as string;

    const cfCountry = req.headers['cf-ipcountry'] as string;
    const cfCity = req.headers['cf-ipcity'] as string;
    const cfRegion = req.headers['cf-region'] as string;

    if (vercelCountry || vercelCity || cfCountry) {
      return {
        country: vercelCountry || cfCountry || 'Unknown',
        countryCode: vercelCountry || cfCountry || undefined,
        city: vercelCity ? decodeURIComponent(vercelCity) : cfCity || undefined,
        region: vercelRegion || cfRegion || undefined,
        isp: 'Cloudflare / Vercel Edge',
        latitude: vercelLat ? parseFloat(vercelLat) : undefined,
        longitude: vercelLon ? parseFloat(vercelLon) : undefined,
        cachedAt: Date.now(),
      };
    }

    // 2. Localhost or private IP
    if (this.isPrivateIp(ip)) {
      return {
        country: 'Cambodia (Local Dev / Intranet)',
        countryCode: 'KH',
        city: 'Phnom Penh',
        region: 'Phnom Penh',
        isp: 'Local Development Network',
        latitude: 11.5564,
        longitude: 104.9282,
        cachedAt: Date.now(),
      };
    }

    // 3. Cache lookup
    const cached = this.geoCache.get(ip);
    if (cached && Date.now() - cached.cachedAt < 2 * 60 * 60 * 1000) {
      return cached;
    }

    // 4. Fast GeoIP API lookup
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const geo: CachedGeo = {
            country: data.country || 'Unknown',
            countryCode: data.countryCode || undefined,
            city: data.city || undefined,
            region: data.regionName || undefined,
            isp: data.isp || data.org || undefined,
            latitude: data.lat,
            longitude: data.lon,
            cachedAt: Date.now(),
          };
          this.geoCache.set(ip, geo);
          return geo;
        }
      }
    } catch (err: any) {
      this.logger.debug(`GeoIP lookup error for ${ip}: ${err.message}`);
    }

    return {
      country: 'Unknown',
      cachedAt: Date.now(),
    };
  }

  /**
   * Parse user agent string to identify OS and Browser
   */
  parseUserAgent(ua: string) {
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    let deviceType = 'Desktop';

    if (!ua) return { os, browser, deviceType };

    // Device Type
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'Tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      deviceType = 'Mobile';
    }

    // OS
    if (/windows nt 10\.0/i.test(ua)) os = 'Windows 10/11';
    else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
    else if (/iphone os ([0-9_]+)/i.test(ua)) {
      const match = ua.match(/iphone os ([0-9_]+)/i);
      os = `iOS ${match ? match[1].replace(/_/g, '.') : ''}`;
    } else if (/ipad.*os ([0-9_]+)/i.test(ua)) {
      const match = ua.match(/os ([0-9_]+)/i);
      os = `iPadOS ${match ? match[1].replace(/_/g, '.') : ''}`;
    } else if (/android ([0-9.]+)/i.test(ua)) {
      const match = ua.match(/android ([0-9.]+)/i);
      os = `Android ${match ? match[1] : ''}`;
    } else if (/mac os x ([0-9_]+)/i.test(ua)) {
      const match = ua.match(/mac os x ([0-9_]+)/i);
      os = `macOS ${match ? match[1].replace(/_/g, '.') : ''}`;
    } else if (/linux/i.test(ua)) {
      os = 'Linux';
    }

    // Browser
    if (/edg\/([0-9.]+)/i.test(ua)) {
      const match = ua.match(/edg\/([0-9.]+)/i);
      browser = `Microsoft Edge ${match ? match[1].split('.')[0] : ''}`;
    } else if (/chrome\/([0-9.]+)/i.test(ua) && !/edg/i.test(ua)) {
      const match = ua.match(/chrome\/([0-9.]+)/i);
      browser = `Google Chrome ${match ? match[1].split('.')[0] : ''}`;
    } else if (/firefox\/([0-9.]+)/i.test(ua)) {
      const match = ua.match(/firefox\/([0-9.]+)/i);
      browser = `Mozilla Firefox ${match ? match[1].split('.')[0] : ''}`;
    } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
      const match = ua.match(/version\/([0-9.]+)/i);
      browser = `Safari ${match ? match[1] : ''}`;
    }

    return { os, browser, deviceType };
  }

  /**
   * Records tracking event and dispatches real-time Telegram alert into Topic #60 (Security & Audit)
   */
  async recordEvent(req: Request, dto: TrackingEventDto, authUser?: any) {
    const ip = this.extractRealIp(req, dto.clientReportedIp);
    const geo = await this.resolveGeoLocation(req, ip);

    const ua = (req.headers['user-agent'] as string) || '';
    const parsedUa = this.parseUserAgent(ua);

    const os = dto.device?.os || parsedUa.os;
    const browser = dto.device?.browser || parsedUa.browser;
    const deviceType = dto.device?.deviceType || parsedUa.deviceType;
    const screenRes = dto.device?.screenResolution || 'Unknown Screen';
    const language = dto.device?.language || 'km-KH';

    // Prioritize high-accuracy coordinates if passed by browser
    const latitude = dto.location?.latitude || geo.latitude;
    const longitude = dto.location?.longitude || geo.longitude;

    const action = dto.action || 'PAGE_VIEW';
    const path = dto.path || '/';

    const userId = authUser?.id || authUser?.sub || null;
    const userEmail = authUser?.email || null;
    const userRole = authUser?.role || null;
    const userName = authUser?.fullNameKh || authUser?.fullNameEn || null;

    // Asynchronously save to PostgreSQL (non-blocking for performance)
    this.prisma.visitorLog
      .create({
        data: {
          sessionId: dto.sessionId || null,
          ipAddress: ip,
          country: geo.country || 'Unknown',
          countryCode: geo.countryCode || null,
          city: geo.city || null,
          region: geo.region || null,
          isp: geo.isp || null,
          latitude: latitude || null,
          longitude: longitude || null,
          deviceType,
          os,
          browser,
          screenResolution: screenRes,
          language,
          path,
          title: dto.title || null,
          referrer: dto.referrer || null,
          action,
          userId,
          userEmail,
          userRole,
          userName,
          details: dto.details || {},
        },
      })
      .catch((err) => {
        this.logger.debug(`Could not write visitor log: ${err.message}`);
      });

    // Check if we should alert to Telegram
    const shouldAlert = this.evaluateTelegramAlert(ip, action, path);
    if (shouldAlert) {
      this.dispatchTelegramAlert({
        action,
        path,
        title: dto.title,
        ip,
        geo,
        deviceType,
        os,
        browser,
        screenRes,
        language,
        latitude,
        longitude,
        referrer: dto.referrer,
        authUser,
        details: dto.details,
      }).catch((err) => {
        this.logger.debug(`Telegram visitor alert dispatch failed: ${err.message}`);
      });
    }

    return {
      success: true,
      ip,
      location: {
        city: geo.city,
        country: geo.country,
        isp: geo.isp,
      },
    };
  }

  /**
   * Evaluates alert rules and throttles rapid duplicate alerts per IP
   */
  private evaluateTelegramAlert(ip: string, action: string, path: string): boolean {
    const now = Date.now();
    const key = `${ip}_${action}_${path}`;
    const ipGeneralKey = `${ip}_general`;

    // 1. Critical Actions: ALWAYS alert immediately with zero throttle
    const criticalActions = [
      'USER_LOGIN',
      'USER_LOGIN_FAILED',
      'USER_LOGOUT',
      'PASSWORD_CHANGED',
      'CHECKOUT_KHQR',
      'PAYMENT_SETTLED',
      'STAFF_CREATED',
      'BACKUP_TRIGGERED',
      'RESTRICTED_ACCESS_ATTEMPT',
    ];

    if (criticalActions.includes(action)) {
      this.alertThrottle.set(key, now);
      return true;
    }

    // 2. Sensitive Paths: Alert with 30s throttle
    const sensitivePaths = ['/billing', '/settings', '/users', '/reports'];
    if (sensitivePaths.some((p) => path.startsWith(p))) {
      const last = this.alertThrottle.get(key) || 0;
      if (now - last > 30000) {
        this.alertThrottle.set(key, now);
        return true;
      }
      return false;
    }

    // 3. General Page Views: Alert on initial visit or 60s throttle per IP
    const lastGeneral = this.alertThrottle.get(ipGeneralKey) || 0;
    if (now - lastGeneral > 60000) {
      this.alertThrottle.set(ipGeneralKey, now);
      return true;
    }

    return false;
  }

  /**
   * Dispatches structured HTML alert into Telegram Security & Audit Topic #60
   */
  private async dispatchTelegramAlert(params: {
    action: string;
    path: string;
    title?: string;
    ip: string;
    geo: CachedGeo;
    deviceType: string;
    os: string;
    browser: string;
    screenRes: string;
    language: string;
    latitude?: number;
    longitude?: number;
    referrer?: string;
    authUser?: any;
    details?: Record<string, any>;
  }) {
    const actionMapKh: Record<string, string> = {
      PAGE_VIEW: 'ចូលមើលទំព័រ (Page View)',
      USER_LOGIN: 'ចុះឈ្មោះចូលប្រើប្រព័ន្ធជោគជ័យ (Login Success)',
      USER_LOGIN_FAILED: 'ព្យាយាម Login មិនត្រឹមត្រូវ (Failed Login Attempt)',
      USER_LOGOUT: 'ចាកចេញពីប្រព័ន្ធ (Logout)',
      PASSWORD_CHANGED: 'ផ្លាស់ប្តូរពាក្យសម្ងាត់ (Password Changed)',
      CHECKOUT_KHQR: 'បង្កើតការទូទាត់ KHQR (KHQR Created)',
      PAYMENT_SETTLED: 'ទូទាត់ប្រាក់បានជោគជ័យ (Payment Settled)',
      STAFF_CREATED: 'បង្កើតបុគ្គលិកថ្មី (Staff Created)',
      BACKUP_TRIGGERED: 'ដំណើរការ Backup ប្រព័ន្ធ (Emergency Backup)',
      RESTRICTED_ACCESS_ATTEMPT: 'ព្យាយាមចូលទំព័រគ្មានសិទ្ធិ (Restricted Access Attempt)',
    };

    const actionKh = actionMapKh[params.action] || `សកម្មភាព: ${params.action}`;

    let userDisplay = 'ភ្ញៀវទូទៅ (Guest Visitor)';
    if (params.authUser) {
      const name = params.authUser.fullNameKh || params.authUser.fullNameEn || params.authUser.email;
      const role = params.authUser.role || 'USER';
      userDisplay = `${name} [${role}]`;
    }

    const locationParts: string[] = [];
    if (params.geo.city) locationParts.push(params.geo.city);
    if (params.geo.region && params.geo.region !== params.geo.city) locationParts.push(params.geo.region);
    if (params.geo.country) locationParts.push(params.geo.country);

    const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';
    const ispText = params.geo.isp ? ` (ISP: ${params.geo.isp})` : '';

    let mapLinkHtml = '';
    if (params.latitude && params.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${params.latitude},${params.longitude}`;
      mapLinkHtml = `• <b>ផែនទី Google Maps:</b> <a href="${mapsUrl}">មើលទីតាំងលើផែនទី (${params.latitude.toFixed(4)}, ${params.longitude.toFixed(4)})</a>\n`;
    }

    const now = new Date();
    const dateStr = now.toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });

    const messageHtml = [
      `<b>[ការតាមដានចរាចរណ៍ & សកម្មភាព] ពេទ្យ ហួន វណ្ណៈ</b>`,
      `• <b>សកម្មភាព:</b> ${actionKh}`,
      `• <b>ទំព័រ (URL):</b> <code>${params.path}</code>`,
      `• <b>អ្នកប្រើប្រាស់:</b> ${userDisplay}`,
      `• <b>IP ពិតប្រាកដ:</b> <code>${params.ip}</code>`,
      `• <b>ទីតាំង (Location):</b> ${locationText}${ispText}`,
      mapLinkHtml ? mapLinkHtml.trim() : null,
      `• <b>ឧបករណ៍ (Device):</b> ${params.deviceType} (${params.os} • ${params.browser})`,
      `• <b>ទំហំអេក្រង់:</b> ${params.screenRes} (ភាសា: ${params.language})`,
      `• <b>ប្រភព (Referrer):</b> ${params.referrer || 'Direct Visit (ចូលផ្ទាល់)'}`,
      `• <b>កាលបរិច្ឆេទ:</b> ${dateStr} (ម៉ោងកម្ពុជា)`,
    ]
      .filter(Boolean)
      .join('\n');

    // Send into Topic #60 (Security & Audit)
    await this.telegramService.notify('SECURITY', messageHtml);
  }

  /**
   * Retrieves visitor analytics for system owner and dashboard
   */
  async getVisitorStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalVisits, todayVisits, recentVisitors] = await Promise.all([
      this.prisma.visitorLog.count(),
      this.prisma.visitorLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.visitorLog.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalVisits,
      todayVisits,
      recentVisitors: recentVisitors.map((v) => ({
        ...v,
        id: v.id.toString(),
      })),
    };
  }
}

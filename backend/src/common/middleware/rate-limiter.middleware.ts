import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly ipStore = new Map<string, RateRecord>();
  private readonly loginStore = new Map<string, RateRecord>();
  private readonly trackingStore = new Map<string, RateRecord>();

  constructor() {
    // Periodic garbage collection every 3 minutes to avoid memory leaks
    setInterval(() => {
      const now = Date.now();
      this.cleanup(this.ipStore, now);
      this.cleanup(this.loginStore, now);
      this.cleanup(this.trackingStore, now);
    }, 180000).unref();
  }

  private cleanup(store: Map<string, RateRecord>, now: number) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }

  private getClientIp(req: Request): string {
    const cfIp = req.headers['cf-connecting-ip'] as string;
    if (cfIp) return cfIp.trim();

    const trueClientIp = req.headers['true-client-ip'] as string;
    if (trueClientIp) return trueClientIp.trim();

    const xRealIp = req.headers['x-real-ip'] as string;
    if (xRealIp) return xRealIp.trim();

    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const first = xForwardedFor.split(',')[0]?.trim();
      if (first) return first;
    }

    const socketIp = req.ip || req.socket?.remoteAddress || '';
    return socketIp.replace(/^::ffff:/, '').trim() || '127.0.0.1';
  }

  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req);
    const now = Date.now();
    const windowMs = 60000; // 60 seconds rolling window
    const path = req.originalUrl || req.url;

    // 1. Strict Anti-Brute-Force for Authentication Login Endpoint (Max 8 attempts / minute)
    if (path.includes('/auth/login') && req.method === 'POST') {
      const loginRecord = this.loginStore.get(ip) || { count: 0, resetAt: now + windowMs };
      if (now > loginRecord.resetAt) {
        loginRecord.count = 0;
        loginRecord.resetAt = now + windowMs;
      }

      loginRecord.count++;
      this.loginStore.set(ip, loginRecord);

      if (loginRecord.count > 8) {
        const retryAfter = Math.ceil((loginRecord.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Too many authentication attempts. Rate limit active. Please retry in ${retryAfter} seconds.`,
        });
        return;
      }
    }

    // 2. Telemetry Flood Protection for Tracking Endpoint (Max 60 requests / minute)
    if (path.includes('/tracking/event') && req.method === 'POST') {
      const trackingRecord = this.trackingStore.get(ip) || { count: 0, resetAt: now + windowMs };
      if (now > trackingRecord.resetAt) {
        trackingRecord.count = 0;
        trackingRecord.resetAt = now + windowMs;
      }

      trackingRecord.count++;
      this.trackingStore.set(ip, trackingRecord);

      if (trackingRecord.count > 60) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Tracking rate limit exceeded. Telemetry throttled.',
        });
        return;
      }
    }

    // 3. Global Anti-DoS Rate Limiter for all API routes (Max 150 requests / minute)
    const ipRecord = this.ipStore.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > ipRecord.resetAt) {
      ipRecord.count = 0;
      ipRecord.resetAt = now + windowMs;
    }

    ipRecord.count++;
    this.ipStore.set(ip, ipRecord);

    const maxGlobal = 150;
    const remaining = Math.max(0, maxGlobal - ipRecord.count);

    res.setHeader('X-RateLimit-Limit', maxGlobal);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(ipRecord.resetAt / 1000));

    if (ipRecord.count > maxGlobal) {
      const retryAfter = Math.ceil((ipRecord.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `API rate limit exceeded. Maximum ${maxGlobal} requests per minute allowed. Retry in ${retryAfter} seconds.`,
      });
      return;
    }

    next();
  }
}

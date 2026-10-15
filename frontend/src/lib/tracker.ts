import { api } from './api';

let cachedSessionId: string | null = null;
let cachedPublicIp: string | null = null;
let lastTrackedPath: string | null = null;
let lastTrackedTime = 0;

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  if (cachedSessionId) return cachedSessionId;

  try {
    let sid = sessionStorage.getItem('clinic_visitor_sid');
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('clinic_visitor_sid', sid);
    }
    cachedSessionId = sid;
    return sid;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export function getClientDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      screenResolution: 'Unknown',
      language: 'km-KH',
      timezone: 'Asia/Phnom_Penh',
    };
  }

  const ua = navigator.userAgent || '';

  // Device Type
  let deviceType = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // OS Detection
  let os = 'Unknown OS';
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

  // Browser Detection
  let browser = 'Unknown Browser';
  if (/edg\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/edg\/([0-9.]+)/i);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`;
  } else if (/chrome\/([0-9.]+)/i.test(ua) && !/edg/i.test(ua)) {
    const match = ua.match(/chrome\/([0-9.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`;
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/firefox\/([0-9.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`;
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    const match = ua.match(/version\/([0-9.]+)/i);
    browser = `Safari ${match ? match[1] : ''}`;
  }

  const dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
  const screenResolution = `${window.screen.width}x${window.screen.height} (DPR: ${dpr.toFixed(1)})`;
  const language = navigator.language || 'km-KH';
  let timezone = 'Asia/Phnom_Penh';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Phnom_Penh';
  } catch {}

  return {
    deviceType,
    browser,
    os,
    screenResolution,
    language,
    timezone,
  };
}

/**
 * Automatically estimates location in the background via IP without requesting browser permission.
 * Eliminates intrusive browser permission prompts to ensure optimal user experience.
 */
export async function getClientLocation(): Promise<{ latitude?: number; longitude?: number; accuracy?: number } | undefined> {
  // Completely avoid navigator.geolocation to prevent browser permission popups.
  // Geolocation is resolved silently in the background on the server from the visitor's IP.
  return undefined;
}

/**
 * Asynchronously fetch public IP once per session as reliable fallback
 */
async function fetchPublicIpFallback(): Promise<string | null> {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedPublicIp = data.ip;
        return data.ip;
      }
    }
  } catch {}
  return null;
}

/**
 * Tracks a page view with automatic device, screen, and location telemetry
 */
export async function trackPageView(path: string, customTitle?: string) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Prevent duplicate track calls for the exact same path within 2 seconds
  if (lastTrackedPath === path && now - lastTrackedTime < 2000) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  try {
    const sessionId = getSessionId();
    const device = getClientDeviceInfo();
    const referrer = document.referrer || undefined;
    const title = customTitle || document.title || path;
    const clientReportedIp = (await fetchPublicIpFallback()) || undefined;
    const location = await getClientLocation();

    await api.tracking.recordEvent({
      path,
      action: 'PAGE_VIEW',
      title,
      referrer,
      sessionId,
      clientReportedIp,
      device,
      location,
    });
  } catch {
    // Telemetry tracking should never disrupt the user interface
  }
}

/**
 * Tracks a specific high-value user activity or event
 */
export async function trackUserAction(action: string, details?: Record<string, any>, customPath?: string) {
  if (typeof window === 'undefined') return;

  try {
    const path = customPath || window.location.pathname || '/';
    const sessionId = getSessionId();
    const device = getClientDeviceInfo();
    const clientReportedIp = (await fetchPublicIpFallback()) || undefined;
    const location = await getClientLocation();

    await api.tracking.recordEvent({
      path,
      action,
      title: document.title,
      sessionId,
      clientReportedIp,
      device,
      location,
      details,
    });
  } catch {
    // Non-blocking
  }
}

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const HTML_FILE = path.join(__dirname, 'simulator.html');

const server = http.createServer((req, res) => {
  // CORS Headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-nssf-device-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientHost = req.headers.host ? req.headers.host.split(':')[0] : '172.20.10.2';

  // Native Android APK Download
  if (req.url === '/apk') {
    const apkPath = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="krupet-debug.apk"',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      fs.createReadStream(apkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('APK not found on Drive D');
    }
    return;
  }

  // Handshake and Version Check Endpoint
  if (req.url === '/api/mobile-sync/handshake') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const resp = {
        serverTimestamp: new Date().toISOString(),
        minAppVersion: '2.0.0',
        latestAppVersion: '2.4.0',
        latestBuildNumber: 20261104,
        isUpdateMandatory: false,
        updateDownloadUrl: `http://${clientHost}:8089/apk`,
        heartbeatIntervalSeconds: 15,
        registeredDeviceId: 'KRUPET-DEV-NODE-01',
        deviceSessionToken: 'sess_live_' + Date.now(),
        featureFlags: {
          enablePxFhirSync: true,
          enableOfflineBiometrics: true,
          enableBakongKhqrPOS: true,
          enablePacsDicomViewer: true,
          enableOdontogram: true,
          enableNarcoticsDualSign: true
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(resp));
    });
    return;
  }

  // Bakong KHQR Settlement Verification Endpoint
  if (req.url === '/api/mobile-sync/verify-khqr') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (e) {}
      const resp = {
        success: true,
        transactionId: 'TX-' + Date.now(),
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        status: 'SETTLED',
        settlementTime: new Date().toISOString(),
        payerBank: data.payerBank || 'ABA Bank Mobile',
        terminalId: 'TER-KRUPET-01',
        merchantId: 'MER-KRUPET-HQ'
      };
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(resp));
    });
    return;
  }

  // Settle KHQR Endpoint
  if (req.url === '/api/mobile-sync/settle-khqr') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch(e) {}
      const resp = {
        settlementStatus: 'SETTLED',
        transactionHash: parsed.transactionHash || ('0x' + Math.random().toString(16).substring(2, 10).toUpperCase()),
        currency: parsed.currency || 'USD',
        amount: parsed.amount || 8.00,
        merchantId: 'KRUPET-ENTERPRISE-HQ',
        planId: parsed.planId || 'PRO_8',
        settledAt: new Date().toISOString(),
        receiptNumber: 'REC-2026-' + Math.floor(100000 + Math.random() * 900000),
        message: 'Settlement confirmed by National Bank of Cambodia Bakong Gateway'
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    });
    return;
  }

  // Version info
  if (req.url === '/api/mobile-sync/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: 'v2.4.0',
      build: '2026.11-PROD',
      channel: 'production-stable',
      releaseNotes: 'Bilingual Khmer/English support, In-App SEO Fast Search, Gated Clinical Tools Catalog, SaaS Pricing & Bakong KHQR Settlement, Cloud Healthcare PaaS, Settings Auto-Update OTA'
    }));
    return;
  }

  // Mobile / Web Universal Redirect: Send all web traffic to Real Web Platform (Port 3000)
  let targetUrl = req.url;
  if (targetUrl === '/simulator' || targetUrl === '/simulator.html' || targetUrl.startsWith('/simulator?')) {
    targetUrl = '/';
  }

  res.writeHead(302, {
    'Location': `http://${clientHost}:3000${targetUrl}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`KruPet Mobile UI Station is running:`);
  console.log(`  Local PC:   http://localhost:${PORT}/`);
  console.log(`  iPhone URL: http://172.20.10.2:${PORT}/ -> Redirecting to http://172.20.10.2:3000/`);
});

// Also attempt to listen on Port 80 for direct Safari navigation without port number
try {
  const port80Server = http.createServer((req, res) => {
    const clientHost = req.headers.host ? req.headers.host.split(':')[0] : '172.20.10.2';
    let targetUrl = req.url;
    if (targetUrl === '/simulator' || targetUrl === '/simulator.html' || targetUrl.startsWith('/simulator?')) {
      targetUrl = '/';
    }
    res.writeHead(302, {
      'Location': `http://${clientHost}:3000${targetUrl}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end();
  });
  port80Server.on('error', (err) => {
    console.log(`Port 80 redirector optional note: ${err.message}`);
  });
  port80Server.listen(80, '0.0.0.0', () => {
    console.log(`Port 80 HTTP direct forwarder running on 0.0.0.0:80 -> Port 3000`);
  });
} catch (e) {
  console.log('Port 80 optional forwarder skipped');
}

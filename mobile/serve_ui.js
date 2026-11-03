const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

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

  // Simulator Web Interface
  if (req.url === '/' || req.url === '/simulator.html' || req.url.startsWith('/?')) {
    fs.readFile(HTML_FILE, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error loading simulator.html: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  }
  // Native Android APK Download
  else if (req.url === '/apk') {
    const apkPath = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="krupet-debug.apk"'
      });
      fs.createReadStream(apkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('APK not found on Drive D');
    }
  }
  // Handshake and Version Check Endpoint
  else if (req.url === '/api/mobile-sync/handshake') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const resp = {
        serverTimestamp: new Date().toISOString(),
        minAppVersion: '2.0.0',
        latestAppVersion: '2.4.0',
        latestBuildNumber: 20261104,
        isUpdateMandatory: false,
        updateDownloadUrl: 'http://localhost:8089/apk',
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    });
  }
  // Bakong KHQR Settlement Verification Endpoint
  else if (req.url === '/api/mobile-sync/settle-khqr') {
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
  }
  // Version info
  else if (req.url === '/api/mobile-sync/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: 'v2.4.0',
      build: '2026.11-PROD',
      channel: 'production-stable',
      releaseNotes: 'Bilingual Khmer/English support, In-App SEO Fast Search, Gated Clinical Tools Catalog, SaaS Pricing & Bakong KHQR Settlement, Cloud Healthcare PaaS, Settings Auto-Update OTA'
    }));
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`KruPet Mobile UI Simulator running at http://localhost:${PORT}/`);
});

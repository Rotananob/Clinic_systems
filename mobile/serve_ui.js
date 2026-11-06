const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const NEXT_PORT = 3000;
const NEST_PORT = 4000;

function proxyRequest(req, res, targetPort) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${targetPort}`,
      'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1',
      'x-forwarded-proto': 'http',
    },
  };

  const proxy = http.request(options, (targetRes) => {
    const headers = { ...targetRes.headers };
    // Prevent mobile Safari from caching stale content
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
    res.writeHead(targetRes.statusCode, headers);
    targetRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Gateway connection error: ' + err.message);
  });

  req.pipe(proxy, { end: true });
}

function handleRequest(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-nssf-device-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // APK Download
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

  // Rewrite /simulator to /
  if (req.url === '/simulator' || req.url === '/simulator.html' || req.url.startsWith('/simulator?')) {
    req.url = '/';
  }

  // Route /api to NestJS backend (port 4000)
  if (req.url.startsWith('/api/') && !req.url.startsWith('/api-relay/')) {
    return proxyRequest(req, res, NEST_PORT);
  }

  // All other web traffic -> Next.js frontend (port 3000)
  return proxyRequest(req, res, NEXT_PORT);
}

// 1. Port 8089 Server
const server8089 = http.createServer(handleRequest);
server8089.listen(PORT, '0.0.0.0', () => {
  console.log(`Port 8089 Proxy running -> 0.0.0.0:${PORT} forwarding to Next.js :${NEXT_PORT} and NestJS :${NEST_PORT}`);
});

// 2. Port 80 Server (Direct Safari / Phone Navigation)
try {
  const server80 = http.createServer(handleRequest);
  server80.on('error', (err) => {
    console.log(`Port 80 warning: ${err.message}`);
  });
  server80.listen(80, '0.0.0.0', () => {
    console.log(`Port 80 Reverse Proxy running -> 0.0.0.0:80 forwarding to Next.js :${NEXT_PORT} and NestJS :${NEST_PORT}`);
  });
} catch (e) {
  console.log('Port 80 skipped:', e.message);
}
